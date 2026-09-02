import React, { useState } from 'react';
import './App.css';

/**
 * React অ্যাপ টেমপ্লেট
 * এই টেমপ্লেট Fiverr এবং Upwork এ বিক্রয় করা যায়
 */

function App() {
    const [count, setCount] = useState(0);
    const [todos, setTodos] = useState([]);
    const [input, setInput] = useState('');

    const addTodo = () => {
        if (input.trim()) {
            setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
            setInput('');
        }
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    return (
        <div className="app">
            <header>
                <h1>React টুডো অ্যাপ</h1>
            </header>

            <main>
                <section className="counter">
                    <h2>কাউন্টার: {count}</h2>
                    <button onClick={() => setCount(count + 1)}>বৃদ্ধি করুন</button>
                    <button onClick={() => setCount(count - 1)}>হ্রাস করুন</button>
                </section>

                <section className="todos">
                    <h2>টুডো তালিকা</h2>
                    <div className="input-group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                            placeholder="নতুন কাজ যোগ করুন..."
                        />
                        <button onClick={addTodo}>যোগ করুন</button>
                    </div>

                    <ul className="todo-list">
                        {todos.map(todo => (
                            <li key={todo.id}>
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => toggleTodo(todo.id)}
                                />
                                <span className={todo.completed ? 'completed' : ''}>
                                    {todo.text}
                                </span>
                                <button onClick={() => deleteTodo(todo.id)}>❌</button>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
        </div>
    );
}

export default App;
