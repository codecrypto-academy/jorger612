import React, { useState } from 'react';
import ethersService from '../services/ethersService';

const UserForm = ({ onUserCreated, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'La edad es requerida';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 150) {
        newErrors.age = 'La edad debe ser un número entre 1 y 150';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Creando usuario:', formData.name, formData.age);
      const receipt = await ethersService.createUser(
        formData.name.trim(),
        parseInt(formData.age)
      );
      
      console.log('Transacción exitosa:', receipt);
      
      // Reset form
      setFormData({ name: '', age: '' });
      setErrors({});
      
      // Notify parent component
      onUserCreated();
      
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: `Error al crear el usuario: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = loading || isSubmitting;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span style={{ fontSize: '24px' }}>👤</span>
          Crear Nuevo Usuario
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nombre del Usuario
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Ingrese el nombre del usuario"
            disabled={isDisabled}
          />
          {errors.name && (
            <div className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="age" className="form-label">
            Edad
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className={`form-input ${errors.age ? 'error' : ''}`}
            placeholder="Ingrese la edad"
            min="1"
            max="150"
            disabled={isDisabled}
          />
          {errors.age && (
            <div className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.age}
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="error-message" style={{ 
            color: '#dc2626', 
            fontSize: '0.875rem', 
            marginBottom: '1rem',
            padding: '0.75rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem'
          }}>
            {errors.submit}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', age: '' });
              setErrors({});
            }}
            className="btn btn-secondary"
            disabled={isDisabled}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isDisabled}
          >
            <span>💾</span>
            {isSubmitting ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
