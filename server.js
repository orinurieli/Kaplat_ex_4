const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// ! use CORS if the port of the client is different from the server.
const cors = require('cors');

const app = express();
const port = 9583;

// variables
const todos = [
  {
    id: 1,
    title: 'Complete Project Proposal',
    content: 'Write a detailed project proposal for the client',
    dueDate: '2023-05-25',
    status: 'PENDING',
  },
  {
    id: 2,
    title: 'Prepare Presentation Slides',
    content: 'Create a visually appealing presentation for the meeting',
    dueDate: '2023-05-28',
    status: 'PENDING',
  },
  {
    id: 3,
    title: 'Review Code Changes',
    content: 'Go through the latest code changes and provide feedback',
    dueDate: '2023-05-30',
    status: 'PENDING',
  },
];
let requestCounter = 0;

const logsFolder = path.join(__dirname, 'logs');

// Ensure the 'logs' folder exists
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

app.use(bodyParser.json());

app.use(requestLogger);

app.use((req, res, next) => {
  requestCounter++;
  next();
});

app.use(cors());



// Endpoint #1
app.get('/todo/health',requestLogger, (req, res) => {
    res.send('OK');
});

// Endpoint #2
app.post('/todo',requestLogger, (req, res) => {
  const { title, content, dueDate } = req.body;

  // Log the creation of a new TODO with the title
  writeToLogFile('todos.log', `INFO: Creating new TODO with Title [${title}]`);

  if (findTodoByTitle(title)) {
    // Log the error message if TODO with the same title already exists
    writeToLogFile('todos.log', `ERROR: TODO with the title [${title}] already exists in the system`);
    return res.status(409).json({
      result: null,
      errorMessage: `Error: TODO with the title [${title}] already exists in the system`,
    });
  }

  if (dueDate <= Date.now()) {
    // Log the error message if the due date is in the past
    writeToLogFile('todos.log', 'ERROR: Can’t create new TODO that its due date is in the past');
    return res.status(409).json({
      result: null,
      errorMessage: 'Error: Can’t create new TODO that its due date is in the past',
    });
  }

  const newTodo = {
    id: todos.length + 1,
    title,
    content,
    dueDate,
    status: 'PENDING',
  };
  todos.push(newTodo);

  // Log the total number of existing TODOs and the new TODO ID
  writeToLogFile('todos.log', `DEBUG: Currently there are ${todos.length} TODOs in the system. New TODO will be assigned with id ${newTodo.id}`);

  res.status(200).json({ result: newTodo.id });
});

// Endpoint #3
app.get('/todo/size',requestLogger, (req, res) => {
  const {status} = req.query;
  let count;

  if (!status || status === 'ALL') {
    count = todos.length;
  } else if (status === 'PENDING') {
    count = todos.filter(todo => todo.status === 'PENDING').length;
  } else if (status === 'LATE') {
    count = todos.filter(todo => todo.status === 'LATE').length;
  } else if (status === 'DONE') {
    count = todos.filter(todo => todo.status === 'DONE').length;
  } else {
    res.status(400).json({ errorMessage: 'Invalid status filter' });
    return;
  }

  // Log the total TODOs count
  writeToLogFile('todos.log', `INFO: Total TODOs count for state ${status} is ${count}`);

  res.json({ result: count });
});

// Endpoint #4
app.get('/todo/content',requestLogger, (req, res) => {
  const { status = 'ALL', sortBy = 'ID' } = req.query;
  const availableStatuses = ['ALL', 'PENDING', 'LATE', 'DONE'];
  const availableSortFields = ['ID', 'DUE_DATE', 'TITLE'];
    
  if (!availableStatuses.includes(status) || !availableSortFields.includes(sortBy)) {
    writeToLogFile('todos.log', 'ERROR: Bad request');
    return res.status(400).json({ errorMessage: 'Bad request' });
  }

  // Log the extraction of todos content with filter and sorting details
  const filter = `Filter: ${status}`;
  const sorting = `Sorting by: ${sortBy}`;
  writeToLogFile('todos.log', `INFO: Extracting todos content. ${filter} | ${sorting}`);

  let todosContent;
  switch (status) {
    case 'PENDING':
      todosContent = todos.filter((todo) => todo.status === 'PENDING');
      break;
    case 'LATE':
      todosContent = todos.filter((todo) => todo.status === 'LATE');
      break;
    case 'DONE':
      todosContent = todos.filter((todo) => todo.status === 'DONE');
      break;
    default:
      todosContent = todos;
  }

  switch (sortBy) {
    case 'DUE_DATE':
      todosContent.sort((a, b) => a.dueDate - b.dueDate);
      break;
    case 'TITLE':
      todosContent.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      todosContent.sort((a, b) => a.id - b.id);
  }

  const totalTodos = todos.length;
  const returnedTodos = todosContent.length;
  writeToLogFile('todos.log', `DEBUG: There are a total of ${totalTodos} todos in the system. The result holds ${returnedTodos} todos`);

  res.status(200).json(todosContent);
});

// Endpoint #5
app.put('/todo',requestLogger, (req, res) => {
  const todoId = parseInt(req.query.id);
  const newStatus = req.query.status.toUpperCase();

  // Check if the provided status is valid
  if (newStatus !== 'PENDING' && newStatus !== 'LATE' && newStatus !== 'DONE') {
    writeToLogFile('todos.log', 'ERROR: Invalid status');
    return res.status(400).json({ errorMessage: 'Invalid status' });
  }

  // Find the TODO with the provided ID
  const todoIndex = todos.findIndex(todo => todo.id === todoId);
  if (todoIndex === -1) {
    writeToLogFile('todos.log', `ERROR: No TODO with ID ${todoId} found`);
    return res.status(404).json({ errorMessage: `No TODO with ID ${todoId} found` });
  }

  // Update the TODO's status
  const oldStatus = todos[todoIndex].status;
  todos[todoIndex].status = newStatus;

  writeToLogFile('todos.log', `INFO: Update TODO id [${todoId}] state to ${newStatus}`);
  writeToLogFile('todos.log', `DEBUG: Todo id [${todoId}] state change: ${oldStatus} --> ${newStatus}`);

  // Send the old status as the response
  return res.json({ result: oldStatus });
});

// Endpoint #6
app.delete('/todo',requestLogger, (req, res) => {
    const id = parseInt(req.query.id);
  const todoIndex = todos.findIndex((todo) => todo.id === parseInt(id));

  if (todoIndex === -1) {
        writeToLogFile('todos.log', `ERROR: Error: no such TODO with id ${id}`);
    res.status(404).json({ errorMessage: `Error: no such TODO with id ${id}` });
    return;
  }

  const deletedTodo = todos.splice(todoIndex, 1)[0];

  // Log the removal of TODO with ID and total remaining TODOs
  writeToLogFile('requests.log', `INFO: Removing todo id ${id}`);
  writeToLogFile('requests.log', `DEBUG: After removing todo id [${id}] there are ${todos.length} TODOs in the system`);

  res.json({ result: todos.length });
});

// Endpoint to get the current level of a logger
app.get('/logs/level', (req, res) => {
  const loggerName = req.query['logger-name'];
  
  // Check if the logger name is provided
  if (!loggerName) {
    res.status(400).send('Failure: Logger name is required');
    return;
  }

  // Find the logger by name and get its current log level
  const logger = getLoggerByName(loggerName);
  if (!logger) {
    res.status(404).send('Failure: Logger not found');
    return;
  }

  // Return the current log level of the logger
  res.send(logger.level.toUpperCase());
});

// Endpoint to set the level of a logger
app.put('/logs/level', (req, res) => {
  const loggerName = req.query['logger-name'];
  const loggerLevel = req.query['logger-level'];

  // Check if the logger name and level are provided
  if (!loggerName || !loggerLevel) {
    res.status(400).send('Failure: Logger name and level are required');
    return;
  }

  // Find the logger by name and set its log level
  const logger = getLoggerByName(loggerName);
  if (!logger) {
    res.status(404).send('Failure: Logger not found');
    return;
  }

  // Set the log level of the logger
  logger.setLevel(loggerLevel);

  // Return the updated log level of the logger
  res.send(logger.level.toUpperCase());
});


app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
  writeToLogFile('server.log', 'Server started.');
})


// Functions 
function findTodoByTitle(title) {
  return todos.find((todo) => todo.title === title);
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const requestNumber = requestCounter;

  // Log incoming request to requests.log file
  writeToLogFile('requests.log', `INFO: Incoming request | #${requestNumber} | resource: ${req.path} | HTTP Verb ${req.method}`);

  // Log request duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    writeToLogFile('requests.log', `DEBUG: request #${requestNumber} duration: ${duration}ms`);
  });

  next();
}


// Function to write logs to a file
function writeToLogFile(logFileName, logMessage) {
  if (!logFileName) {
    const timestamp = new Date().getTime();
    logFileName = `log_${timestamp}.txt`;
  }

  const logFilePath = path.join(logsFolder, logFileName);
  const logLine = `${new Date().toLocaleString()} ${logMessage}\n`;

  fs.appendFile(logFilePath, logLine, (err) => {
    if (err) {
      console.error(`Error writing to log file: ${err}`);
    }
  });
}
