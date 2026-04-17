import ts from 'typescript';

export function createHidePrivateDeclarationsTransformer(): ts.TransformerFactory<ts.SourceFile | ts.Bundle> {
  return (context) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isClassDeclaration(node)) {
        const members = node.members.filter((member) => !hasPrivateModifier(member));
        return context.factory.updateClassDeclaration(
          node,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          members
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (source) => ts.visitNode(source, visitor) as ts.SourceFile | ts.Bundle;
  };
}

function hasPrivateModifier(node: ts.Node): boolean {
  const modifiers = (node as ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
  return Boolean(modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword));
}

