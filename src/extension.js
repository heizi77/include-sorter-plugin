const vscode = require('vscode');
const { sortIncludes } = require('./sort-includes');

/** Регистрирует команду расширения в VS Code. */
function activate(context) {
  const command = vscode.commands.registerCommand(
    'cppIncludeSorter.sortSelection',
    sortSelectedIncludes,
  );
  context.subscriptions.push(command);
}

/** Сортирует выделенный блок и заменяет его одной правкой, которую можно отменить. */
async function sortSelectedIncludes() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !['c', 'cpp'].includes(editor.document.languageId)) {
    vscode.window.showWarningMessage('Откройте файл C или C++.');
    return;
  }

  if (editor.selections.length !== 1 || editor.selection.isEmpty) {
    vscode.window.showWarningMessage('Выделите один блок строк #include.');
    return;
  }

  const { document, selection } = editor;
  const range = getFullLineRange(document, selection);
  if (!range) {
    vscode.window.showWarningMessage('Выделите строки #include целиком.');
    return;
  }

  const original = document.getText(range);
  const lineEnding = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  const sorted = sortIncludes(original.split(lineEnding));
  if (sorted === null) {
    vscode.window.showWarningMessage(
      'Выделение должно содержать только отдельные строки #include <...> или #include "...".',
    );
    return;
  }

  const replacement = sorted.join(lineEnding);
  if (replacement === original) {
    vscode.window.showInformationMessage('Директивы #include уже отсортированы.');
    return;
  }

  const applied = await editor.edit((edit) => edit.replace(range, replacement));
  if (!applied) {
    vscode.window.showWarningMessage('Не удалось применить изменения к выделению.');
  }
}

/** Проверяет границы выделения и исключает перенос строки после блока. */
function getFullLineRange(document, selection) {
  const { start, end } = selection;
  if (start.character !== 0) {
    return null;
  }

  if (end.character === 0) {
    return new vscode.Range(start, document.lineAt(end.line - 1).range.end);
  }

  const lastLine = document.lineAt(end.line);
  if (end.character !== lastLine.text.length) {
    return null;
  }

  return new vscode.Range(start, end);
}

module.exports = { activate };