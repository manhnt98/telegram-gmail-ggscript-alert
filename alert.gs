//Main function
function main(){
  var file = findFile('application/vnd.google-apps.document', '[Do not delete] FAC&FFM script');
  editedContent = processStarredEmails('[Gmail]/Alarm/FAC&FFM UP', file, 'UP: ', 'up');
  if (editedContent != ''){
    postMessageToTelegram(editedContent);
    clearFile(file);
  }
  else{
    Logger.log("Empty message");
  }
  processStarredEmails('[Gmail]/Alarm/FAC&FFM DOWN', file, 'DOWN: ', 'down');
}

//Send message to telegram
function postMessageToTelegram(message) {
  // Provide the Id of your Telegram group or channel
  const chatId = '<chat-group-id>';

  const BOT_TOKEN = '<bot-token>';

  const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  message = "Down for more than 10 minutes:" + '\n' + message;
  const text = encodeURIComponent(message);

  const url = `${TELEGRAM_API}?chat_id=${chatId}&text=${text}`;

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  const { ok, description } = JSON.parse(response);

  if (ok !== true) {
    Logger.log(`Error: ${description}`);
  }
};

//Check star
function processStarredEmails(folderName, file, separator, type) {
  // Replace 'Folder Name' with the name of your Gmail folder that contains starred emails
  var folder = getGmailFolder(folderName);

  if (folder) {
    var threads = folder.getThreads();
    var editedContent = '';
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var messages = thread.getMessages();

      for (var j = 0; j < messages.length; j++) {
        var message = messages[j];

        if (message.isStarred()) {
          // Do something with the starred message
          message.unstar();
          extractedPart = extractSubjectPartWithSeparator(message.getSubject(), separator);
          if (type == 'down')
            editedContent += extractedPart + '\n';
          else
            editedContent = removeStringInFile(extractedPart, file);
        }
      }
    }

    if (editedContent != '')
      editFile(file, editedContent);

    return editedContent;
  } 
  else {
    Logger.log("Folder '" + folderName + "' not found.");
  }
}

//Get folder object
function getGmailFolder(folderName) {
  var folders = GmailApp.getUserLabels();
  for (var i = 0; i < folders.length; i++) {
    var folder = folders[i];
    if (folder.getName() == folderName) {
      return folder;
    }
  }
  return null;
}

//Get name of alert from subject
function extractSubjectPartWithSeparator(subject, separator) {
  // Replace 'Separator' with the string that separates the part you want to extract
  var regex = new RegExp('.*' + separator + '(.*)');
  var match = subject.match(regex);

  if (match && match.length == 2) {
    Logger.log('Extracted parts: ' + match[1]);
    return match[1];
  }
}

//Find file in folder
function findFile(fileType, folderName){
  var folder = getDriveFolder(folderName);
  if (!folder) {
    Logger.log("Folder '" + folderName + "' not found.");
    return;
  }
  var files = folder.getFilesByType(fileType);
  var file = files.next();
  return file;
}

//Find string in file, remove all line
function findStringInFile(searchString, editedContent, file) {
  var fileName = 'DOWN list'; // Replace with the name of the file you want to search in

  if (file.getName() == fileName) {
    var content = DocumentApp.openById(file.getId()).getBody().getText();
    if (content.indexOf(searchString) == -1) {
      editedContent += searchString + '\n';
    }
  }

  Logger.log('editedContent down: ' + editedContent);
  return editedContent;
}

function getDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return null;
}

//Remove line
function removeStringInFile(searchString, file) {
  var fileName = 'DOWN list'; // Replace with the name of the file you want to search in

  if (file.getName() == fileName) {
    var document = DocumentApp.openById(file.getId());
    var body = document.getBody();
    var text = body.getText().split('\n');
    Logger.log('lines:  ' + text);
    var modifiedLines = text.filter(function(line) {
      return line.indexOf(searchString) == -1;
    });
    var modifiedContent = modifiedLines.join('\n');

    body.setText(modifiedContent);
  }
  var editedContent = body.getText();
  Logger.log('editedContent up: ' + editedContent);
  return editedContent;
}

//Edit file
function editFile(file, editedContent){
  var document = DocumentApp.openById(file.getId());
  var body = document.getBody();
  body.clear();
  body.setText(editedContent);
  document.saveAndClose();
}

//Clear file
function clearFile(file){
  var body = DocumentApp.openById(file.getId()).getBody();
  body.clear();
}