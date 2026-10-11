import ts from 'typescript';
import {
  ACCESSIBILITY_MODIFIERS,
  type ClassLikeNode,
  getMemberName,
  getModifiers,
  isConvertibleMember,
  isConstructorParameter,
  isStatic,
} from './class-utils.js';
import { type Collision, findHashCollisions } from './collision.js';

/** Records the smallest possible text edits, so untouched code keeps its original formatting. */
export interface EditSink {
  /** Replaces a node with new text, e.g. an identifier with `#identifier`. */
  rename(node: ts.Node, text: string): void;
  /** Removes a node, optionally swallowing the whitespace that follows it. */
  remove(node: ts.Node, trailingSpace: boolean): void;
  /** Inserts text at a source position. */
  insert(position: number, text: string): void;
}

export interface ClassRewriteContext {
  sink: EditSink;
  onCollision(collisions: Collision[], node: ClassLikeNode): void;
}

interface PrivateNameSets {
  instance: Set<string>;
  static: Set<string>;
}

/**
 * Rewrites one class in place through `sink`:
 *
 * - `private x` / `private m()` become `#x` / `#m()`, and their `this.x`
 *   references follow.
 * - `constructor(private x: T)` keeps a plain parameter, gains an explicit
 *   `this.#x = x` assignment, and declares the field it needs.
 *
 * References are only rewritten through `this` and the class name, and the
 * rewrite never descends into a nested class: nested classes are rewritten by
 * their own call, so an inner class sees neither the outer private names nor
 * the other way around.
 */
export function rewriteClassToHash(node: ClassLikeNode, context: ClassRewriteContext): void {
  const names = collectPrivateNames(node);
  if (names.instance.size === 0 && names.static.size === 0) {
    return;
  }

  const collisions = findHashCollisions(node);
  if (collisions.length > 0) {
    context.onCollision(collisions, node);
    return;
  }

  const allNames = new Set([...names.instance, ...names.static]);
  const scope: ReferenceScope = { names: allNames, staticNames: names.static, className: node.name?.text };

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];

    if (isConvertibleMember(member)) {
      rewriteMember(member, scope, context.sink);
      continue;
    }

    if (ts.isConstructorDeclaration(member)) {
      if (member.body) {
        rewriteReferences(member.body, scope, context.sink);
      }

      rewriteConstructor(member, names.instance, context.sink);
      continue;
    }

    rewriteReferences(member, scope, context.sink);
  }
}

/** `private x = 1` becomes `#x = 1`: drop the visibility keyword, add the hash. */
function rewriteMember(member: ts.ClassElement, scope: ReferenceScope, sink: EditSink): void {
  const modifiers = getModifiers(member);
  if (modifiers) {
    for (let i = 0; i < modifiers.length; i++) {
      const modifier = modifiers[i];
      if (ACCESSIBILITY_MODIFIERS.includes(modifier.kind)) {
        sink.remove(modifier, true);
      }
    }
  }

  const name = getMemberName(member);
  if (name && 'name' in member && member.name) {
    sink.rename(member.name, `#${name}`);
  }

  rewriteReferences(member, scope, sink);
}

/**
 * `constructor(private x: T) {}` implies both an `x` field and `this.x = x`.
 * With a hash name the field must be declared explicitly, the parameter keeps a
 * plain name, and the assignment is emitted where TypeScript would have put it.
 *
 * The field declaration goes right before the constructor, so a subclass that
 * overwrites `#x` after `super()` observes the constructor parameter, exactly
 * as it would with TypeScript's own parameter properties.
 */
function rewriteConstructor(constructor: ts.ConstructorDeclaration, instanceNames: Set<string>, sink: EditSink): void {
  const fields: string[] = [];
  const assignments: string[] = [];

  for (let i = 0; i < constructor.parameters.length; i++) {
    const parameter = constructor.parameters[i];
    if (!isConstructorParameter(parameter) || !instanceNames.has(parameter.name.text)) {
      continue;
    }

    const name = parameter.name.text;
    const modifiers = parameter.modifiers ?? [];
    for (let j = 0; j < modifiers.length; j++) {
      sink.remove(modifiers[j], true);
    }

    fields.push(`#${name}${fieldAnnotation(parameter)};`);
    assignments.push(`this.#${name} = ${name};`);
  }

  if (fields.length === 0) {
    return;
  }

  const { indent, startsLine } = lineContext(constructor);
  if (startsLine) {
    sink.insert(constructor.getStart(), `${fields.join(`\n${indent}`)}\n${indent}`);
  } else {
    paddedInsert(sink, constructor, fields.join(' '));
  }

  if (constructor.body) {
    insertStatement(sink, constructor.getSourceFile(), assignmentPosition(constructor), assignments.join(' '));
  }
}

/** Declares the fields before the constructor, matching whether it starts its own line. */
function paddedInsert(sink: EditSink, node: ts.Node, text: string): void {
  insertStatement(sink, node.getSourceFile(), node.getStart(), text);
}

/**
 * Inserts `text` where more code follows: on its own indented line when the
 * following code starts a line, otherwise inline with a separating space only
 * where the surrounding characters are not whitespace already.
 */
function insertStatement(sink: EditSink, sourceFile: ts.SourceFile, position: number, text: string): void {
  const source = sourceFile.getFullText();
  const nextLine = /^[ \t]*\r?\n([ \t]*)/.exec(source.slice(position));

  if (nextLine) {
    sink.insert(position, `\n${nextLine[1]}${text}`);
    return;
  }

  const lead = isSpace(source[position - 1]) ? '' : ' ';
  const trail = isSpace(source[position]) ? '' : ' ';
  sink.insert(position, `${lead}${text}${trail}`);
}

function isSpace(character: string | undefined): boolean {
  return character === undefined || character === ' ' || character === '\t' || character === '\n' || character === '\r';
}

/** Where `this.#x = x` belongs: after `super(...)` in a derived class, else at the top of the body. */
function assignmentPosition(constructor: ts.ConstructorDeclaration): number {
  const body = constructor.body;
  if (!body) {
    return constructor.getEnd();
  }

  for (let i = 0; i < body.statements.length; i++) {
    const statement = body.statements[i];
    if (
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      statement.expression.expression.kind === ts.SyntaxKind.SuperKeyword
    ) {
      return statement.getEnd();
    }
  }

  return body.getStart() + 1;
}

function fieldAnnotation(parameter: ts.ParameterDeclaration): string {
  const bang = parameter.questionToken ? '!' : '';
  const type = parameter.type ? `: ${parameter.type.getText()}` : '';
  return `${bang}${type}`;
}

/**
 * The whitespace that precedes a node: its line indentation, and whether the
 * node is the first thing on its line.
 */
function lineContext(node: ts.Node): { indent: string; startsLine: boolean } {
  const text = node.getSourceFile().getFullText();
  let start = node.getStart();

  while (start > 0 && text[start - 1] !== '\n') {
    start -= 1;
  }

  let end = start;
  while (end < text.length && (text[end] === ' ' || text[end] === '\t')) {
    end += 1;
  }

  return { indent: text.slice(start, end), startsLine: end === node.getStart() };
}

/** Rewrites `this.x` and `Class.x` into `this.#x` / `Class.#x` for the class' private names. */
function rewriteReferences(node: ts.Node, scope: ReferenceScope, sink: EditSink): void {
  ts.forEachChild(node, function visit(child: ts.Node): undefined {
    if (ts.isClassDeclaration(child) || ts.isClassExpression(child)) {
      return undefined;
    }

    if (ts.isPropertyAccessExpression(child) && scope.names.has(child.name.text)) {
      const target = child.expression;

      // `this.#x` covers both instance and static members: reading a static
      // member through `this` is valid JavaScript, and so is `this.instanceName`.
      const reachable =
        target.kind === ts.SyntaxKind.ThisKeyword ||
        // A static member can also be reached through the class name, which is
        // in scope anywhere inside the class body.
        (scope.className !== undefined &&
          ts.isIdentifier(target) &&
          target.text === scope.className &&
          scope.staticNames.has(child.name.text));

      if (reachable) {
        sink.rename(child.name, `#${child.name.text}`);
        return undefined;
      }
    }

    return ts.forEachChild(child, visit);
  });
}

interface ReferenceScope {
  /** All private member names of the class. */
  names: Set<string>;
  /** The subset declared `static`, reachable through the class name as well. */
  staticNames: Set<string>;
  /** The class name, when the class has one, for `<ClassName>.<staticName>` accesses. */
  className: string | undefined;
}

function collectPrivateNames(node: ClassLikeNode): PrivateNameSets {
  const instance = new Set<string>();
  const statics = new Set<string>();

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];

    if (isConvertibleMember(member)) {
      const name = getMemberName(member);
      if (name) {
        (isStatic(member) ? statics : instance).add(name);
      }
      continue;
    }

    // `constructor(private x: T)` declares an instance field too, so `this.x`
    // references to it have to be rewritten as well.
    if (ts.isConstructorDeclaration(member)) {
      for (let j = 0; j < member.parameters.length; j++) {
        const parameter = member.parameters[j];
        if (isConstructorParameter(parameter)) {
          instance.add(parameter.name.text);
        }
      }
    }
  }

  return { instance, static: statics };
}
