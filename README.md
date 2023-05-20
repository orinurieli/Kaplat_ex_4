# Todo App

Kaplat Assignment 4 - Todo App is a simple application that allows you to manage your daily tasks.
The client will be running on port 3000.
The server will be running on port 9583.

## Getting Started

To initialize the project, follow these steps:
1. Open the terminal and navigate to the client directory: <br>
`cd client` <br>

2. Start the development server by running the following command: <br>
`npm start` <br>

3. Open a new terminal window and run the following command: <br>
`npm start` <br>

## Server

The server provides the following endpoints:

- `GET /todo/health`: Retrieves the health status of the server.
- `POST /todo`: Creates a new todo item.
- `GET /todo/size`: Retrieves the number of todo items.
- `GET /todo/content`: Retrieves the content of all todo items.
- `PUT /todo`: Updates an existing todo item.
- `DELETE /todo`: Deletes a todo item.
- `GET /logs/level`: Retrieves the log levels.

## Logs

The following code provides a request logger middleware and a function to write logs to a file:

```javascript
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
```
We use the writeToLogFile function:
```javascript
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
```
Here's an example of how it should look like in the requests.log file: <br>

<img width="519" alt="image" src="https://github.com/orinurieli/Kaplat_ex_4/assets/74871538/197a7657-afd6-4928-b3de-475bec1b7863">


##### Made by [Ori Nurieli](https://github.com/orinurieli)  

