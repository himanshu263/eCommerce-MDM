import { useState, useEffect } from "react";
import { todoAPI } from "../services/api";

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
);
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
);

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await todoAPI.getAll();
      setTodos(res.data.todos);
    } catch (err) {
      console.error("Failed to fetch todos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    try {
      await todoAPI.create(newTodo);
      setNewTodo({ title: "", description: "" });
      fetchTodos();
    } catch (err) {
      console.error("Failed to add todo", err);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      await todoAPI.update(todo.id, { completed: !todo.completed });
      fetchTodos();
    } catch (err) {
      console.error("Failed to toggle todo", err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await todoAPI.delete(id);
      fetchTodos();
    } catch (err) {
      console.error("Failed to delete todo", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ToDo List</h1>
          <p className="text-gray-500 text-sm">Manage your daily tasks</p>
        </div>
      </div>

      <form onSubmit={handleAddTodo} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
            <input
              type="text"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              placeholder="Optional details"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-sm w-full md:w-auto"
        >
          <PlusIcon className="w-5 h-5" />
          Add Task
        </button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading tasks...</div>
        ) : todos.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
            No tasks yet. Add one above!
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border ${
                todo.completed ? "border-green-100 bg-green-50/30" : "border-gray-200"
              } transition-all`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggleTodo(todo)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    todo.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-500"
                  }`}
                >
                  {todo.completed && <CheckCircleIcon className="w-5 h-5" />}
                </button>
                <div>
                  <h3 className={`font-semibold ${todo.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p className={`text-sm ${todo.completed ? "text-gray-300" : "text-gray-500"}`}>
                      {todo.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
