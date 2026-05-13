import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import BrigadeTypes from './pages/BrigadeTypes';
import Brigades from './pages/Brigades';
import Positions from './pages/Positions';
import Roles from './pages/Roles';
import UserData from './pages/UserData';
import WagonTypes from './pages/WagonTypes';
import WagonModels from './pages/WagonModels';
import Wagons from './pages/Wagons';
import WagonMaintenance from './pages/WagonMaintenance';
import LocomotiveModels from './pages/LocomotiveModels';
import Locomotives from './pages/Locomotives';
import LocomotiveMaintenance from './pages/LocomotiveMaintenance';
import Reports from './pages/Reports';
import './global.css';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="departments" element={<Departments />} />
                    <Route path="brigade-types" element={<BrigadeTypes />} />
                    <Route path="brigades" element={<Brigades />} />
                    <Route path="positions" element={<Positions />} />
                    <Route path="roles" element={<Roles />} />
                    <Route path="user-data" element={<UserData />} />
                    <Route path="wagon-types" element={<WagonTypes />} />
                    <Route path="wagon-models" element={<WagonModels />} />
                    <Route path="wagons" element={<Wagons />} />
                    <Route path="wagon-maintenance" element={<WagonMaintenance />} />
                    <Route path="locomotive-models" element={<LocomotiveModels />} />
                    <Route path="locomotives" element={<Locomotives />} />
                    <Route path="locomotive-maintenance" element={<LocomotiveMaintenance />} />
                    <Route path="reports" element={<Reports />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;