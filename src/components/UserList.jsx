import React, { useState } from 'react';
import ethersService from '../services/ethersService';

const UserList = ({ users, loading, onUserSelect, onUserDeleted, onRefresh }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', age: '' });
  const [editErrors, setEditErrors] = useState({});

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar al usuario "${userName}"?`)) {
      return;
    }

    setDeletingId(userId);
    
    try {
      console.log('Eliminando usuario con ID:', userId);
      const receipt = await ethersService.deleteUser(userId);
      console.log('Transacción de eliminación exitosa:', receipt);
      onUserDeleted();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error al eliminar el usuario: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      age: user.age
    });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editForm.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (editForm.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!editForm.age.trim()) {
      newErrors.age = 'La edad es requerida';
    } else {
      const age = parseInt(editForm.age);
      if (isNaN(age) || age < 1 || age > 150) {
        newErrors.age = 'La edad debe ser un número entre 1 y 150';
      }
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      return;
    }

    try {
      console.log('Actualizando usuario:', editingUser.id, editForm.name, editForm.age);
      const receipt = await ethersService.updateUser(
        editingUser.id,
        editForm.name.trim(),
        parseInt(editForm.age)
      );
      
      console.log('Transacción de actualización exitosa:', receipt);
      setEditingUser(null);
      onUserDeleted(); // This will refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      setEditErrors({ submit: `Error al actualizar el usuario: ${error.message}` });
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', age: '' });
    setEditErrors({});
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span style={{ fontSize: '24px' }}>👥</span>
          Lista de Usuarios ({users.length})
        </div>
        <button
          onClick={onRefresh}
          className="btn btn-secondary"
          disabled={loading}
        >
          <span>🔄</span>
          Actualizar
        </button>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '1rem', display: 'block' }}>👥</span>
          <h3>No hay usuarios registrados</h3>
          <p>Los usuarios que crees aparecerán aquí.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Edad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  {editingUser && editingUser.id === user.id ? (
                    <>
                      <td>{user.id}</td>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className={`form-input ${editErrors.name ? 'error' : ''}`}
                          style={{ width: '100%', margin: 0 }}
                        />
                        {editErrors.name && (
                          <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {editErrors.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          name="age"
                          value={editForm.age}
                          onChange={handleEditChange}
                          className={`form-input ${editErrors.age ? 'error' : ''}`}
                          style={{ width: '100%', margin: 0 }}
                          min="1"
                          max="150"
                        />
                        {editErrors.age && (
                          <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {editErrors.age}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={handleSaveEdit}
                            className="btn btn-success"
                            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                          >
                            Cancelar
                          </button>
                        </div>
                        {editErrors.submit && (
                          <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {editErrors.submit}
                          </div>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.age}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => onUserSelect(user)}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem' }}
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem' }}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="btn btn-danger"
                            style={{ padding: '0.5rem' }}
                            disabled={deletingId === user.id}
                            title="Eliminar"
                          >
                            {deletingId === user.id ? (
                              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                            ) : (
                              '🗑️'
                            )}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList;
