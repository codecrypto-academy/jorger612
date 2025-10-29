import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegistrationStatus from '../RegistrationStatus';

describe('RegistrationStatus Component', () => {
  const mockOnContinue = jest.fn();
  const mockOnRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render success state correctly', () => {
    render(
      <RegistrationStatus
        isSuccess={true}
        roleName="Producer"
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText(/Registration Status/i)).toBeInTheDocument();
    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
  });

  test('should render error state correctly', () => {
    render(
      <RegistrationStatus
        isSuccess={false}
        error="Test error message"
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText(/Registration Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
  });

  test('should call onContinue when continue button is clicked', () => {
    render(
      <RegistrationStatus
        isSuccess={true}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByText(/continue to dashboard/i);
    fireEvent.click(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  test('should call onRegister when register button is clicked', () => {
    render(
      <RegistrationStatus
        isSuccess={false}
        onRegister={mockOnRegister}
      />
    );

    const registerButton = screen.getByText(/Register Here/i);
    fireEvent.click(registerButton);
    expect(mockOnRegister).toHaveBeenCalled();
  });
});
