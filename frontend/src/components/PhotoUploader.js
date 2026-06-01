import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function PhotoUploader({ entityType, entityId, onUpload, readOnly = false }) {
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Администрация';

    const fetchPhotos = useCallback(async () => {
        if (!entityId) return;
        try {
            const res = await axios.get(`/api/uploads/${entityType}/${entityId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPhotos(res.data);
        } catch (err) {
            console.error('Ошибка загрузки фото', err);
        }
    }, [entityType, entityId, token]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        setUploading(true);
        try {
            await axios.post('/api/uploads', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            await fetchPhotos();
            if (onUpload) onUpload();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (photoId) => {
        if (!window.confirm('Удалить фото?')) return;
        try {
            await axios.delete(`/api/uploads/${photoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchPhotos();
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        }
    };

    return (
        <div className="photo-uploader">
            {!readOnly && (
                <div className="photo-upload-control">
                    <label className="btn">
                        Выбрать фото
                        <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} style={{ display: 'none' }} />
                    </label>
                    {uploading && <span>Загрузка...</span>}
                </div>
            )}
            <div className="photo-gallery">
                {photos.map(photo => (
                    <div key={photo.id} className="photo-item" onClick={() => setFullscreenPhoto(photo.filePath)}>
                        <img src={photo.filePath} alt={photo.originalName} />
                        {!readOnly && isAdmin && (
                            <div className="photo-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }} className="btn-delete-small">🗑️</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Модальное окно для полноэкранного просмотра */}
            {fullscreenPhoto && (
                <div className="fullscreen-modal" onClick={() => setFullscreenPhoto(null)}>
                    <div className="fullscreen-content" onClick={e => e.stopPropagation()}>
                        <img src={fullscreenPhoto} alt="Полноэкранный режим" />
                        <button className="fullscreen-close" onClick={() => setFullscreenPhoto(null)}>✖</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhotoUploader;