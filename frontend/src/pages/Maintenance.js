import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import PhotoUploader from '../components/PhotoUploader';

function Maintenance() {
    const [records, setRecords] = useState([]);
    const [transportList, setTransportList] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [selectedTransportId, setSelectedTransportId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [availableRequests, setAvailableRequests] = useState([]);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [recognizing, setRecognizing] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        transportId: '',
        date: '',
        description: '',
        requestId: ''
    });
    const [sortColumn, setSortColumn] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Администрация';

    const fetchData = useCallback(async () => {
        try {
            const [recordsRes, transportRes] = await Promise.all([
                axios.get('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/transport', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRecords(recordsRes.data);
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

    // Фильтрация по выбранному ТС
    useEffect(() => {
        if (selectedTransportId) {
            setFilteredRecords(records.filter(r => r.transportId === selectedTransportId));
        } else {
            setFilteredRecords(records);
        }
    }, [records, selectedTransportId]);

    // Загрузка активных заявок для выбранного ТС в форме создания
    useEffect(() => {
        if (formData.transportId && !editingRecord) {
            axios.get(`/api/maintenance-requests/for-transport/${formData.transportId}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setAvailableRequests(res.data);
            }).catch(err => console.error(err));
        } else {
            setAvailableRequests([]);
        }
    }, [formData.transportId, editingRecord, token]);

    // Сортировка записей
    const sortedRecords = [...filteredRecords].sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === 'transport') {
            aVal = a.transportId;
            bVal = b.transportId;
        } else if (sortColumn === 'employee') {
            aVal = a.Employee ? `${a.Employee.lastName} ${a.Employee.firstName}` : '';
            bVal = b.Employee ? `${b.Employee.lastName} ${b.Employee.firstName}` : '';
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
        if (!window.confirm('Удалить запись?')) return;
        try {
            await axios.delete(`/api/maintenance/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setEditingRecord(null);
        setFormData({
            transportId: selectedTransportId || '',
            date: new Date().toISOString().slice(0, 10),
            description: '',
            requestId: ''
        });
        if (selectedFiles.length) {
            selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
            setSelectedFiles([]);
        }
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setFormData({
            transportId: record.transportId,
            date: record.date,
            description: record.description,
            requestId: record.requestId || ''
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
        const { name, value } = e.target;
        if (name === 'transportId') {
            setFormData(prev => ({ ...prev, [name]: value, requestId: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await axios.put(`/api/maintenance/${editingRecord.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Запись обновлена');
                setShowModal(false);
                fetchData();
            } else {
                setUploadingFiles(true);
                const response = await axios.post('/api/maintenance', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const newRecordId = response.data.id;

                if (selectedFiles.length > 0) {
                    const uploadPromises = selectedFiles.map(async (item) => {
                        const fd = new FormData();
                        fd.append('file', item.file);
                        fd.append('entityType', 'MaintenanceRecord');
                        fd.append('entityId', newRecordId);
                        await axios.post('/api/uploads', fd, {
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                        });
                    });
                    await Promise.all(uploadPromises);
                    selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
                    setSelectedFiles([]);
                }

                alert('Запись создана');
                setShowModal(false);
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setUploadingFiles(false);
        }
    };

    const getTransportLabel = (record) => {
        if (!transportList.length) return 'Загрузка...';
        let transport = transportList.find(t => String(t.id) === String(record.transportId));
        if (!transport) return `ТС #${record.transportId}`;
        if (transport.type === 'locomotive') {
            return `Локомотив #${transport.id} (${transport.modelName || 'нет модели'})`;
        } else if (transport.type === 'wagon') {
            return `Вагон #${transport.id} (${transport.modelName || 'нет модели'}, тип: ${transport.wagonType || 'не указан'})`;
        }
        return `ТС #${transport.id}`;
    };

    const handleRecognizeClick = () => {
        fileInputRef.current.click();
    };

    const handleRecognizeFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRecognizing(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post('/api/uploads/detect-number', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.number) {
                setFormData(prev => ({ ...prev, transportId: res.data.number }));
                alert(`Распознан номер: ${res.data.number}`);
            } else {
                alert('Номер не распознан');
            }
        } catch (err) {
            alert('Ошибка распознавания');
        } finally {
            setRecognizing(false);
            e.target.value = ''; // чтобы можно было выбрать тот же файл снова
        }
    };

    

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>История обслуживания</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>Добавить запись</button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Фильтр по транспортному средству:</label>
                <select
                    className="form-input"
                    style={{ width: '300px' }}
                    value={selectedTransportId}
                    onChange={(e) => setSelectedTransportId(e.target.value)}
                >
                    <option value="">Все ТС</option>
                    {transportList.map(ts => (
                        <option key={ts.id} value={ts.id}>
                            {ts.type === 'locomotive' ? `Локомотив #${ts.id}` : `Вагон #${ts.id}`}
                            {ts.modelName ? ` (${ts.modelName})` : ''}
                        </option>
                    ))}
                </select>
                {selectedTransportId && (
                    <button className="btn" onClick={() => setSelectedTransportId('')}>Сбросить</button>
                )}
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>ID <span className="sort-indicator">{getSortIndicator('id')}</span></th>
                        <th onClick={() => handleSort('transport')}>ТС <span className="sort-indicator">{getSortIndicator('transport')}</span></th>
                        <th onClick={() => handleSort('employee')}>Сотрудник <span className="sort-indicator">{getSortIndicator('employee')}</span></th>
                        <th onClick={() => handleSort('date')}>Дата <span className="sort-indicator">{getSortIndicator('date')}</span></th>
                        <th onClick={() => handleSort('description')}>Описание <span className="sort-indicator">{getSortIndicator('description')}</span></th>
                        <th>Фото</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRecords.map(record => (
                        <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{getTransportLabel(record)}</td>
                            <td>{record.Employee ? `${record.Employee.lastName} ${record.Employee.firstName}` : `ID ${record.employeeId}`}</td>
                            <td>{record.date}</td>
                            <td>{record.description}</td>
                            <td>
                                {record.photoCount > 0 && (
                                    <button onClick={() => { setSelectedRecordId(record.id); setShowPhotoModal(true); }} className="btn-photo">📷</button>
                                )}
                            </td>
                            <td>
                                <button onClick={() => openEditModal(record)} className="btn-edit">✏️</button>
                                {isAdmin && <button onClick={() => handleDelete(record.id)} className="btn-delete">🗑️</button>}
                            </td>
                        </tr>
                    ))}
                    {sortedRecords.length === 0 && (
                        <td><td colSpan="7">Нет записей</td></td>
                    )}
                </tbody>
            </table>

            {/* Модальное окно создания/редактирования */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingRecord ? 'Редактировать запись' : 'Добавить запись обслуживания'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Транспортное средство*</label>
                                <select name="transportId" className="form-input" value={formData.transportId} onChange={handleFormChange} required>
                                    <option value="">Выберите ТС</option>
                                    {transportList.map(ts => (
                                        <option key={ts.id} value={ts.id}>
                                            {ts.type === 'locomotive' ? `Локомотив #${ts.id}` : `Вагон #${ts.id}`}
                                            {ts.modelName ? ` (${ts.modelName})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <button type="button" onClick={handleRecognizeClick} disabled={recognizing} className="btn btn-secondary">
                                    {recognizing ? 'Распознаю...' : 'Распознать номер по фото'}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleRecognizeFile}
                                />
                            </div>
                            <div className="form-group">
                                <label>Связанная заявка</label>
                                <select name="requestId" className="form-input" value={formData.requestId || ''} onChange={handleFormChange} disabled={!formData.transportId}>
                                    <option value="">-- Не выбрана --</option>
                                    {availableRequests.map(req => (
                                        <option key={req.id} value={req.id}>
                                            Заявка #{req.id} (желаемая дата: {req.desiredDate || 'не указана'})
                                        </option>
                                    ))}
                                </select>
                                {!formData.transportId && <small>Сначала выберите транспортное средство</small>}
                            </div>
                            <div className="form-group">
                                <label>Дата*</label>
                                <input type="date" name="date" className="form-input" value={formData.date} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label>Описание</label>
                                <textarea name="description" className="form-input" rows="3" value={formData.description} onChange={handleFormChange}></textarea>
                            </div>

                            {editingRecord && (
                                <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                                    <h4>Фотографии записи</h4>
                                    <PhotoUploader
                                        entityType="MaintenanceRecord"
                                        entityId={editingRecord.id}
                                        onUpload={() => fetchData()}
                                    />
                                </div>
                            )}

                            {!editingRecord && (
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

            {/* Модальное окно просмотра фото */}
            {showPhotoModal && (
                <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Фотографии записи #{selectedRecordId}</h3>
                        <PhotoUploader
                            entityType="MaintenanceRecord"
                            entityId={selectedRecordId}
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

export default Maintenance;