/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
// General libs
import React from 'react';
import { useEffect, useState } from 'react';
import classNames from 'classnames';
// components
import { TodoList } from './components/TodoList/TodoList';
import { TodoCreate } from './components/TodoCreate/TodoCreate';
import { TodoFooter } from './components/TodoFooter/TodoFooter';
import { UserWarning } from './UserWarning';
// api
import * as todoServices from './api/todos';
// Types
import { Todo } from './types/Todo';
import { StatusFilter } from './types/StatusFilter';
import { filterTodos } from './utils/filterTodos';
import { ErrorType } from './types/ErrorType';

export const App: React.FC = () => {
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    StatusFilter.All,
  );
  const [errorType, setErrorType] = useState<ErrorType>(ErrorType.NO_ERROR);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const sendError = (error: ErrorType) => {
    setErrorType(error);

    const timer = setTimeout(() => {
      setErrorType(ErrorType.NO_ERROR);
      // unmounts the timer, so it won't be duplicated
      clearTimeout(timer);
    }, 3000);
  };

  useEffect(() => {
    const getTodosFromServer = async () => {
      // I decided to try async this time. That's just for my own practice.
      try {
        const todos = await todoServices.getTodos(); // Also, it's supposed to be a bit more efficient.

        setTodoList(todos);
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Impossible to download the todos');
        sendError(ErrorType.LOAD_TODOS);
      }
    };

    getTodosFromServer();
  }, []);

  // Filtering the list
  const filteredTodos = filterTodos(statusFilter, todoList);
  // Count all active todos. (so we have to use the raw data from the server, not the filtered one)
  const countActiveTodos = todoList.filter(todo => !todo.completed).length;
  // if the total amount of the todos is bigger than active ones, then there are completed todos
  // otherwise there aren't any
  const hasCompletedTodos = todoList.length > countActiveTodos;

  const clearCompleted = async () => {
    const completedTodos = todoList.filter(todo => todo.completed);

    for (const todo of completedTodos) {
      try {
        await todoServices.deleteTodo(todo.id);
        setTodoList(currentTodoList =>
          currentTodoList.filter(currentTodo => currentTodo.id !== todo.id),
        );
      } catch (error) {
        setErrorType(ErrorType.DELETE_TODO);
      }
    }
  };

  if (!todoServices.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoCreate
          setTodoList={setTodoList}
          sendError={sendError}
          userId={todoServices.USER_ID}
          setTempTodo={setTempTodo}
          todoList={todoList}
        />

        {todoList.length > 0 && (
          <>
            <TodoList
              todoList={filteredTodos}
              tempTodo={tempTodo}
              sendError={sendError}
              setTodoList={setTodoList}
            />
            <TodoFooter
              setStatusFilter={setStatusFilter}
              statusFilter={statusFilter}
              countActiveTodos={countActiveTodos}
              hasCompletedTodos={hasCompletedTodos}
              clearCompleted={clearCompleted}
            />
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: errorType === ErrorType.NO_ERROR },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorType(ErrorType.NO_ERROR)}
        />
        {errorType}
      </div>
    </div>
  );
};
