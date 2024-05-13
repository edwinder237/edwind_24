import { useState } from 'react';
import { useRouter } from 'next/router';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (username === 'admin' && password === 'edwind-admin') {
      // Redirect to '/projects' upon successful login
      router.push('/projects');
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
        </div>
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <button type="button" onClick={handleLogin}>Login</button>
      </form>
    </div>
  );
};

export default LoginForm;

