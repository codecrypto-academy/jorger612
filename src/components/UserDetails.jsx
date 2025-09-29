import React, { useState } from 'react';
import ethersService from '../services/ethersService';

const UserDetails = ({ user, onUserUpdated, onUserDeleted, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    age: user.age
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: user.name,
      age: user.age
    });
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: user.name,
      age: user.age
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Actualizando usuario desde detalles:', user.id, editForm.name, editForm.age);
      const receipt = await ethersService.updateUser(
        user.id,
        editForm.name.trim(),
        parseInt(editForm.age)
      );
      
      console.log('Transacción de actualización exitosa:', receipt);
      setIsEditing(false);
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ submit: `Error al actualizar el usuario: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Está seguro de que desea eliminar al usuario "${user.name}"?`)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Eliminando usuario desde detalles:', user.id);
      const receipt = await ethersService.deleteUser(user.id);
      console.log('Transacción de eliminación exitosa:', receipt);
      onUserDeleted();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error al eliminar el usuario: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
          <span style={{ fontSize: '24px' }}>👤</span>
          Detalles del Usuario
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                <span>✏️</span>
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={isSubmitting}
              >
                <span>🗑️</span>
                Eliminar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="btn btn-success"
                disabled={isSubmitting}
              >
                <span>💾</span>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                <span>❌</span>
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">ID del Usuario</label>
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '1rem'
          }}>
            {user.id}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre</label>
          {isEditing ? (
            <>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.name}
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: '#f9fafb', 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}>
              {user.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Edad</label>
          {isEditing ? (
            <>
              <input
                type="number"
                name="age"
                value={editForm.age}
                onChange={handleChange}
                className={`form-input ${errors.age ? 'error' : ''}`}
                min="1"
                max="150"
                disabled={isSubmitting}
              />
              {errors.age && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.age}
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: '#f9fafb', 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}>
              {user.age} años
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Estado</label>
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}>
            <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
              {user.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {errors.submit && (
          <div style={{ 
            color: '#dc2626', 
            fontSize: '0.875rem',
            padding: '0.75rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            {errors.submit}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
