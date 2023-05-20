import React, { useState, useEffect } from 'react';
import { Button, TextField } from '@material-ui/core';
import axios from 'axios';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');

  
  useEffect(() => {
    fetchTodos();
  }, []);

 const fetchTodos = async () => {
    try {
const response = await axios.get('http://localhost:9583/todo/content');
      console.log(response.data);
      setTodos(response.data);
    } catch (error) {
      console.error(error);
    }
  };


  const handleCreateTodo = async () => {
    try {
      const response = await axios.post(`http://localhost:9583/todo`, {
        title,
        content,
        dueDate: new Date(dueDate).getTime(),
      });
      setTitle('');
      setContent('');
      setDueDate('');
      fetchTodos();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:9583/todo?id=${id}`);
      fetchTodos();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h1>{`TODO List (${todos.length})`}</h1>
      <div>
        <TextField
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextField
          label="Content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <TextField
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          autoFocus
        />
        <Button style={{margin:10, marginLeft:'30px' ,backgroundColor: "lightBlue"}} onClick={handleCreateTodo}>Create Todo</Button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <h2>{todo.title}</h2>
            <p>{todo.content}</p>
            <p>Due Date: {new Date(todo.dueDate).toLocaleDateString()}</p>
            <p>Status: {todo.status}</p>
            <Button style={{backgroundColor: "red"}} onClick={() => handleDeleteTodo(todo.id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
