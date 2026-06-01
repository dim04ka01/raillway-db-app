import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PhotoUploader from '../components/PhotoUploader';

function MaintenanceRequests() {
    const [requests, setRequests] = useState([]);
    const [transportList, setTransportList] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [formData, setFormData] = useState({
        transportId: '',
        desiredDate: '',
        description: ''
    });
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]); // массив { file, preview }
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [sortColumn, setSortColumn] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Администрация';
    const isManagerOrAdmin = userRole === 'Администрация' || userRole === 'Руководитель отдела';

    const fetchData = useCallback(async () => {
        try {
            const [requestsRes, transportRes] = await Promise.all([
                axios.get('/api/maintenance-requests', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/transport', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRequests(requestsRes.data);
            setTransportList(transportRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (statusFilter) {
            setFilteredRequests(requests.filter(r => r.status === statusFilter));
        } else {
            setFilteredRequests(requests);
        }
    }, [requests, statusFilter]);

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'transport') {
            aVal = a.transportInfo?.id || a.transportId;
            bVal = b.transportInfo?.id || b.transportId;
        } else if (sortColumn === 'manager') {
            aVal = a.Manager ? `${a.Manager.lastName} ${a.Manager.firstName}` : '';
            bVal = b.Manager ? `${b.Manager.lastName} ${b.Manager.firstName}` : '';
        } else {
            aVal = a[sortColumn];
            bVal = b[sortColumn];
        }
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (column) => {
        if (sortColumn !== column) return '';
        return sortDirection === 'asc' ? '▲' : '▼';
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('Удалить заявку? Это действие необратимо.')) return;
        try {
            await axios.delete(`/api/maintenance-requests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Заявка удалена');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!isAdmin) return;
        if (!window.confirm(`Изменить статус заявки на "${newStatus}"?`)) return;
        try {
            await axios.put(`/api/maintenance-requests/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Статус обновлён');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка изменения статуса');
        }
    };

    const openCreateModal = () => {
        setEditingRequest(null);
        setFormData({
            transportId: '',
            desiredDate: new Date().toISOString().slice(0, 10),
            description: ''
        });
        if (selectedFiles.length) {
            selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
            setSelectedFiles([]);
        }
        setShowModal(true);
    };

    const openEditModal = (req) => {
        if (!isAdmin) return;
        setEditingRequest(req);
        setFormData({
            transportId: req.transportId,
            desiredDate: req.desiredDate || '',
            description: req.description || ''
        });
        setShowModal(true);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
        e.target.value = '';
    };

    const removeFile = (index) => {
        const file = selectedFiles[index];
        if (file && file.preview) {
            URL.revokeObjectURL(file.preview);
        }
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRequest) {
                await axios.put(`/api/maintenance-requests/${editingRequest.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Заявка обновлена');
                setShowModal(false);
                fetchData();
            } else {
                setUploadingFiles(true);
                const response = await axios.post('/api/maintenance-requests', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const newRequestId = response.data.id;

                if (selectedFiles.length > 0) {
                    const uploadPromises = selectedFiles.map(async (item) => {
                        const fd = new FormData();
                        fd.append('file', item.file);
                        fd.append('entityType', 'MaintenanceRequest');
                        fd.append('entityId', newRequestId);
                        await axios.post('/api/uploads', fd, {
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                        });
                    });
                    await Promise.all(uploadPromises);
                    selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
                    setSelectedFiles([]);
                }

                alert('Заявка создана');
                setShowModal(false);
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setUploadingFiles(false);
        }
    };

    const getTransportLabel = (ts) => {
        if (!ts) return '—';
        if (ts.type === 'locomotive') {
            return `Локомотив #${ts.id} (${ts.modelName || 'нет модели'})`;
        } else if (ts.type === 'wagon') {
            return `Вагон #${ts.id} (${ts.modelName || 'нет модели'}, тип: ${ts.wagonType || 'не указан'})`;
        }
        return `ТС #${ts.id}`;
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Заявки на техосмотр</h1>
                {isManagerOrAdmin && (
                    <button className="btn btn-primary" onClick={openCreateModal}>Создать заявку</button>
                )}
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Фильтр по статусу:</label>
                <select className="form-input" style={{ width: '130px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Все</option>
                    <option value="В ожидании">В ожидании</option>
                    <option value="Выполнена">Выполнена</option>
                </select>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('transport')}>ТС <span className="sort-indicator">{getSortIndicator('transport')}</span></th>
                        <th onClick={() => handleSort('manager')}>Руководитель <span className="sort-indicator">{getSortIndicator('manager')}</span></th>
                        <th onClick={() => handleSort('createdAt')}>Дата создания <span className="sort-indicator">{getSortIndicator('createdAt')}</span></th>
                        <th onClick={() => handleSort('desiredDate')}>Желаемая дата <span className="sort-indicator">{getSortIndicator('desiredDate')}</span></th>
                        <th onClick={() => handleSort('status')}>Статус <span className="sort-indicator">{getSortIndicator('status')}</span></th>
                        <th>Описание</th>
                        <th>Фото</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRequests.map(req => (
                        <tr key={req.id}>
                            <td>{req.id}</td>
                            <td>{getTransportLabel(req.transportInfo)}</td>
                            <td>{req.Manager ? `${req.Manager.lastName} ${req.Manager.firstName}` : `ID ${req.managerId}`}</td>
                            <td>{req.createdAt}</td>
                            <td>{req.desiredDate || '—'}</td>
                            <td>
                                {isAdmin ? (
                                    <select
                                        className="form-input"
                                        style={{ width: '130px' }}
                                        value={req.status}
                                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                    >
                                        <option value="В ожидании">В ожидании</option>
                                        <option value="Выполнена">Выполнена</option>
                                    </select>
                                ) : (
                                    req.status
                                )}
                            </td>
                            <td>{req.description || '—'}</td>
                            <td>
                                {req.photoCount > 0 && (
                                    <button onClick={() => { setSelectedRequestId(req.id); setShowPhotoModal(true); }} className="btn-photo">📷</button>
                                )}
                            </td>
                            <td>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => openEditModal(req)} className="btn-edit">✏️</button>
                                        <button onClick={() => handleDelete(req.id)} className="btn-delete">🗑️</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {sortedRequests.length === 0 && (
                        <td><td colSpan="9">Нет заявок</td></td>
                    )}
                </tbody>
            </table>

            {showModal && (
                        <div className="modal-overlay" onClick={() => setShowModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h2>{editingRequest ? 'Редактировать заявку' : 'Создать заявку'}</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Транспортное средство*</label>
                                        <select name="transportId" className="form-input" value={formData.transportId} onChange={handleFormChange} required>
                                            <option value="">Выберите</option>
                                            {transportList.map(ts => (
                                                <option key={ts.id} value={ts.id}>
                                                    {ts.type === 'locomotive' ? `Локомотив #${ts.id}` : `Вагон #${ts.id}`}
                                                    {ts.modelName ? ` (${ts.modelName})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Желаемая дата выполнения</label>
                                        <input type="date" name="desiredDate" className="form-input" value={formData.desiredDate} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Описание</label>
                                        <textarea name="description" className="form-input" rows="3" value={formData.description} onChange={handleFormChange}></textarea>
                                    </div>

                                    {editingRequest && (
                                        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                                            <h4>Фотографии заявки</h4>
                                            <PhotoUploader
                                                entityType="MaintenanceRequest"
                                                entityId={editingRequest.id}
                                                onUpload={() => fetchData()}
                                            />
                                        </div>
                                    )}

                                    {!editingRequest && (
                                        <div className="form-group">
                                            <label>Фотографии (можно выбрать несколько)</label>
                                            <div className="photo-uploader">
                                                <div className="photo-upload-control">
                                                    <label className="btn btn-secondary">
                                                        Выбрать фото
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handleFileSelect}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="photo-gallery">
                                                    {selectedFiles.map((item, idx) => (
                                                        <div key={idx} className="photo-item">
                                                            <img src={item.preview} alt={item.file.name} />
                                                            <div className="photo-actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFile(idx)}
                                                                    className="btn-delete-small"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {uploadingFiles && <div>Загрузка фото...</div>}
                                        </div>
                                    )}

                                    <div className="modal-buttons">
                                        <button type="button" className="btn" onClick={() => setShowModal(false)}>Отмена</button>
                                        <button type="submit" className="btn btn-primary" disabled={uploadingFiles}>
                                            {uploadingFiles ? 'Сохранение...' : 'Сохранить'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {showPhotoModal && (
                        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3>Фотографии заявки #{selectedRequestId}</h3>
                                <PhotoUploader
                                    entityType="MaintenanceRequest"
                                    entityId={selectedRequestId}
                                    readOnly={true}
                                    onUpload={() => { }}
                                />
                                <div className="modal-buttons">
                                    <button className="btn" onClick={() => setShowPhotoModal(false)}>Закрыть</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                );
}

                export default MaintenanceRequests;