const bodyEditor = CodeMirror.fromTextArea(document.getElementById('body'), {
  mode: "application/json",
  lineNumbers: true,
  tabSize: 2,
  matchBrackets: true,
  autoCloseBrackets: true
});


function addHeaderField() {
  const headersContainer = document.getElementById('headersContainer');
  const headerDiv = document.createElement('div');
  headerDiv.className = 'row mb-2';

  headerDiv.innerHTML = `
    <div class="col">
        <input type="text" placeholder="Header Key" class="header-key form-control" />
    </div>
    <div class="col">
        <input type="text" placeholder="Header Value" class="header-value form-control" />
    </div>
    <div class="col">
        <button type="button" class="btn btn-light" style="margin: 0" onclick="removeHeaderField(this)">Remove</button>
    </div>
  `;

  headersContainer.appendChild(headerDiv);
}

function removeHeaderField(button) {
  button.parentElement.parentElement.remove();
}

async function sendRequest() {
  const url = document.getElementById('url').value;
  const method = document.getElementById('method').value;
  const body = bodyEditor.getValue() ? JSON.parse(bodyEditor.getValue()) : null;
  
  const headers = {};
  
  document.querySelectorAll('.header-key').forEach((keyElement, index) => {
    const key = keyElement.value;
    const value = document.querySelectorAll('.header-value')[index].value;
    
    if (key) {
      headers[key] = value;
    }
  });

  const response = await fetch('/send-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method, headers, body })
  });

  const result = await response.json();

  document.getElementById('responseStatus').innerText = result.statusCode;
  document.getElementById('responseHeaders').innerText = JSON.stringify(result.headers, null, 2);
  document.getElementById('responseBody').innerText = JSON.stringify(result.data, null, 2);
  
  loadHistory();
}

async function loadHistory() {
  const response = await fetch('/history');
  const history = await response.json();
  const historyContainer = document.getElementById('history');
  
  historyContainer.innerHTML = '';

  history.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    
    entryDiv.innerHTML = `<strong>Req ${index + 1}</strong>: ${entry.method} ${entry.url}`;
    entryDiv.style.cursor = 'pointer';
    entryDiv.onclick = () => loadRequestFromHistory(entry);
    
    historyContainer.appendChild(entryDiv);
  });
}

function loadRequestFromHistory(entry) {
  document.getElementById('url').value = entry.url;
  document.getElementById('method').value = entry.method;
  
  const headersContainer = document.getElementById('headersContainer');

  while (headersContainer.children.length > 1) {
    headersContainer.removeChild(headersContainer.lastChild);
  }

  for (const [key, value] of Object.entries(entry.headers)) {
    addHeaderField();
    
    const lastKeyField = document.querySelectorAll('.header-key');
    const lastValueField = document.querySelectorAll('.header-value');
    
    lastKeyField[lastKeyField.length - 1].value = key;
    lastValueField[lastValueField.length - 1].value = value;
  }

  document.getElementById('body').value = bodyEditor.setValue(entry.body ? JSON.stringify(entry.body, null, 2) : '');
}

function copyResponseParts(partId) {
  const responseText = document.getElementById(partId).innerText;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(responseText)
      .then(() => {
        alert('Response copied to clipboard');
      })
      .catch(err => {
        console.error('Error while copying:', err);
      });
  } else {
    const tempTextArea = document.createElement('textarea');
    
    tempTextArea.value = responseText;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    
    try {
      document.execCommand('copy');
      alert('Response copied to clipboard');
    } catch (err) {
      console.error('Error while copying:', err);
    }
    document.body.removeChild(tempTextArea);
  }
}

loadHistory();