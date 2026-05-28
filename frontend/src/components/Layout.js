import { Outlet, NavLink, useNavigate } from 'react-router-dom';

function Layout() {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Пользователь';
    const userRole = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    const menuItems = [
        // Все имеют доступ
        { path: '/profile', label: 'Мой профиль', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },
        { path: '/maintenance', label: 'История обслуживания', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },
        { path: '/wagons', label: 'Вагоны', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },
        { path: '/wagon-types', label: 'Типы вагонов', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },
        { path: '/wagon-models', label: 'Модели вагонов', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },
        { path: '/locomotives', label: 'Локомотивы', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },
        { path: '/locomotive-models', label: 'Модели локомотивов', roles: ['Администрация', 'Руководитель отдела', 'Сотрудник'] },

        // Доступ имеют руководители и администрация
        { path: '/employees', label: 'Сотрудники', roles: ['Администрация', 'Руководитель отдела'] },
        { path: '/brigades', label: 'Бригады', roles: ['Администрация', 'Руководитель отдела'] },
        { path: '/brigade-types', label: 'Типы бригад', roles: ['Администрация', 'Руководитель отдела'] },

        // Доступ имеет только администрация
        { path: '/user-data', label: 'Учётные записи', roles: ['Администрация'] },
        { path: '/reports', label: 'Отчёты', roles: ['Администрация'] },
        { path: '/positions', label: 'Должности', roles: ['Администрация'] },
        { path: '/departments', label: 'Отделы', roles: ['Администрация'] },
        { path: '/roles', label: 'Роли', roles: ['Администрация'] },
    ];
    const visibleMenu = menuItems.filter(item => item.roles.includes(userRole));

    return (
        <div className="layout">
            <div className="sidebar">
                <h3>ЖД Станция</h3>
                <nav>
                    <ul>
                        {visibleMenu.map(item => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => isActive ? 'active-link' : ''}
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <button onClick={handleLogout}>Выйти</button>
            </div>
            <div className="content">
                <div className="user-info-bar">
                    {userName} ({userRole})
                </div>
                <Outlet />
            </div>
        </div>
    );
}

export default Layout;