import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('/api/auth/login', { login, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('employeeId', response.data.user.employee.id);
            localStorage.setItem('userRole', response.data.user.role);
            localStorage.setItem('userName',
                response.data.user.employee ? `${response.data.user.employee.lastName} ${response.data.user.employee.firstName}` : login);
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка входа');
        }
    };

    return (
        <div className="login-container">
            <h2>Вход в систему</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Логин</label>
                    <input
                        type="text"
                        className="form-input"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Пароль</label>
                    <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Войти</button>
            </form>
        </div>
    );
}

export default Login;