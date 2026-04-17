import ts from 'typescript';
import type { CompanionMember } from '../types/global.js';
import {
  ACCESSIBILITY_KINDS,
  collectCompanionMembers,
  collectPrivateNames,
  filterModifiers,
  hasExtendsClause,
  hasModifier,
  isConvertiblePrivateMember,
  isMovedToCompanion,
  isThisExpression,
  updateClassNode,
} from './class-utils.js';
import { renamePrivateMemberToHash, rewriteHashReferences, transformClassToHash } from './hash.js';

export function transformClassToWeakMap(
  node: ts.ClassDeclaration,
  context: ts.TransformationContext
): ts.VisitResult<ts.Node> {
  const className = node.name?.text;
  if (!className) {
    return transformClassToHash(node, context);
  }

  const names = collectPrivateNames(node);
  const companionMembers = collectCompanionMembers(node);
  const shouldMoveToCompanion = companionMembers.length > 0;

  if (!shouldMoveToCompanion && names.staticNames.size === 0) {
    return node;
  }

  const factory = context.factory;
  const companionName = `${className}__private`;
  const mapName = `__${className}_private`;
  const hasBaseClass = hasExtendsClause(node);

  let hasConstructor = false;
  const classMembers: ts.ClassElement[] = [];

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (isMovedToCompanion(member)) {
      continue;
    }

    const inStaticContext = hasModifier(member, ts.SyntaxKind.StaticKeyword);
    let nextMember = member;

    if (names.instanceNames.size > 0) {
      nextMember = rewriteWeakMapReferences(
        nextMember,
        names.instanceNames,
        names.instanceMethods,
        mapName,
        context
      );
    }

    if (inStaticContext && names.staticNames.size > 0) {
      nextMember = rewriteHashReferences(nextMember, names.staticNames, context);
    }

    if (isConvertiblePrivateMember(nextMember) && inStaticContext) {
      nextMember = renamePrivateMemberToHash(nextMember, factory);
    }

    if (ts.isConstructorDeclaration(nextMember) && shouldMoveToCompanion) {
      hasConstructor = true;
      nextMember = addWeakMapInitToConstructor(nextMember, mapName, companionName, hasBaseClass, factory);
    }

    classMembers.push(nextMember);
  }

  if (shouldMoveToCompanion && !hasConstructor) {
    classMembers.unshift(createWeakMapInitConstructor(mapName, companionName, hasBaseClass, factory));
  }

  const updatedClass = updateClassNode(node, classMembers, factory);
  if (!shouldMoveToCompanion) {
    return updatedClass;
  }

  const companionClass = createCompanionClass(
    companionName,
    companionMembers,
    names.instanceNames,
    names.instanceMethods,
    mapName,
    context
  );
  const weakMapDecl = createWeakMapDeclaration(mapName, factory);

  return [companionClass, weakMapDecl, updatedClass];
}

function createCompanionClass(
  companionName: string,
  sourceMembers: CompanionMember[],
  privateNames: Set<string>,
  privateMethods: Set<string>,
  mapName: string,
  context: ts.TransformationContext
): ts.ClassDeclaration {
  const factory = context.factory;
  const members = sourceMembers.map((entry) => {
    if (entry.kind === 'property') {
      const source = entry.node as ts.PropertyDeclaration;
      const initializer = source.initializer
        ? rewriteWeakMapReferences(source.initializer, privateNames, privateMethods, mapName, context)
        : source.initializer;

      return factory.updatePropertyDeclaration(
        source,
        filterModifiers(source.modifiers, [...ACCESSIBILITY_KINDS, ts.SyntaxKind.StaticKeyword]),
        source.name,
        source.questionToken,
        source.type,
        initializer
      );
    }

    if (entry.kind === 'method') {
      const source = entry.node as ts.MethodDeclaration;
      const body = source.body
        ? rewriteWeakMapReferences(source.body, privateNames, privateMethods, mapName, context)
        : source.body;

      return factory.updateMethodDeclaration(
        source,
        filterModifiers(source.modifiers, [...ACCESSIBILITY_KINDS, ts.SyntaxKind.StaticKeyword]),
        source.asteriskToken,
        source.name,
        source.questionToken,
        source.typeParameters,
        source.parameters,
        source.type,
        body
      );
    }

    if (entry.kind === 'getter') {
      const source = entry.node as ts.GetAccessorDeclaration;
      const body = source.body
        ? rewriteWeakMapReferences(source.body, privateNames, privateMethods, mapName, context)
        : source.body;

      return factory.updateGetAccessorDeclaration(
        source,
        filterModifiers(source.modifiers, [...ACCESSIBILITY_KINDS, ts.SyntaxKind.StaticKeyword]),
        source.name,
        source.parameters,
        source.type,
        body
      );
    }

    const source = entry.node as ts.SetAccessorDeclaration;
    const body = source.body
      ? rewriteWeakMapReferences(source.body, privateNames, privateMethods, mapName, context)
      : source.body;

    return factory.updateSetAccessorDeclaration(
      source,
      filterModifiers(source.modifiers, [...ACCESSIBILITY_KINDS, ts.SyntaxKind.StaticKeyword]),
      source.name,
      source.parameters,
      body
    );
  });

  return factory.createClassDeclaration(
    undefined,
    factory.createIdentifier(companionName),
    undefined,
    undefined,
    members
  );
}

function createWeakMapDeclaration(mapName: string, factory: ts.NodeFactory): ts.VariableStatement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(mapName),
          undefined,
          undefined,
          factory.createNewExpression(factory.createIdentifier('WeakMap'), undefined, [])
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

function createWeakMapInitStatement(
  mapName: string,
  companionName: string,
  factory: ts.NodeFactory
): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(mapName), 'set'),
      undefined,
      [
        factory.createThis(),
        factory.createNewExpression(factory.createIdentifier(companionName), undefined, []),
      ]
    )
  );
}

function addWeakMapInitToConstructor(
  constructorNode: ts.ConstructorDeclaration,
  mapName: string,
  companionName: string,
  hasBaseClass: boolean,
  factory: ts.NodeFactory
): ts.ConstructorDeclaration {
  const body = constructorNode.body ?? factory.createBlock([], true);
  const initStatement = createWeakMapInitStatement(mapName, companionName, factory);
  const statements = [...body.statements];
  const insertIndex = getWeakMapInitInsertIndex(statements, hasBaseClass);
  statements.splice(insertIndex, 0, initStatement);

  return factory.updateConstructorDeclaration(
    constructorNode,
    constructorNode.modifiers,
    constructorNode.parameters,
    factory.updateBlock(body, statements)
  );
}

function createWeakMapInitConstructor(
  mapName: string,
  companionName: string,
  hasBaseClass: boolean,
  factory: ts.NodeFactory
): ts.ConstructorDeclaration {
  const statements: ts.Statement[] = [];
  const parameters: ts.ParameterDeclaration[] = [];

  if (hasBaseClass) {
    const argsId = factory.createIdentifier('args');
    parameters.push(
      factory.createParameterDeclaration(
        undefined,
        factory.createToken(ts.SyntaxKind.DotDotDotToken),
        argsId,
        undefined,
        factory.createArrayTypeNode(factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
        undefined
      )
    );
    statements.push(
      factory.createExpressionStatement(
        factory.createCallExpression(factory.createSuper(), undefined, [factory.createSpreadElement(argsId)])
      )
    );
  }

  statements.push(createWeakMapInitStatement(mapName, companionName, factory));

  return factory.createConstructorDeclaration(
    undefined,
    parameters,
    factory.createBlock(statements, true)
  );
}

function getWeakMapInitInsertIndex(statements: readonly ts.Statement[], hasBaseClass: boolean): number {
  if (!hasBaseClass) {
    return 0;
  }

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      statement.expression.expression.kind === ts.SyntaxKind.SuperKeyword
    ) {
      return i + 1;
    }
  }

  return 0;
}

function rewriteWeakMapReferences<T extends ts.Node>(
  node: T,
  privateNames: Set<string>,
  privateMethods: Set<string>,
  mapName: string,
  context: ts.TransformationContext
): T {
  if (privateNames.size === 0) {
    return node;
  }

  const factory = context.factory;
  const visit: ts.Visitor = (current) => {
    if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) {
      return current;
    }

    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      isThisExpression(current.expression.expression) &&
      privateMethods.has(current.expression.name.text)
    ) {
      const args = current.arguments.map((arg) => ts.visitNode(arg, visit) as ts.Expression);
      const callee = factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          createWeakMapLookup(mapName, factory),
          current.expression.name.text
        ),
        'call'
      );

      return factory.createCallExpression(callee, current.typeArguments, [factory.createThis(), ...args]);
    }

    if (
      ts.isPropertyAccessExpression(current) &&
      isThisExpression(current.expression) &&
      privateNames.has(current.name.text)
    ) {
      return factory.createPropertyAccessExpression(createWeakMapLookup(mapName, factory), current.name);
    }

    return ts.visitEachChild(current, visit, context);
  };

  return ts.visitNode(node, visit) as T;
}

function createWeakMapLookup(mapName: string, factory: ts.NodeFactory): ts.Expression {
  return factory.createNonNullExpression(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(mapName), 'get'),
      undefined,
      [factory.createThis()]
    )
  );
}
