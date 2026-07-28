import Swal from 'sweetalert2';

// Dark themed SweetAlert2 instance
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1a1625',
  color: '#e2e8f0',
  iconColor: undefined,
  customClass: {
    popup: 'swal-dark-toast',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// Success popup message
export const showSuccess = (message) => {
  return Toast.fire({
    icon: 'success',
    title: message,
  });
};

// Success with page reload after toast
export const showSuccessAndReload = (message) => {
  return Toast.fire({
    icon: 'success',
    title: message,
  }).then(() => {
    window.location.reload();
  });
};

// Error popup message
export const showError = (message) => {
  return Toast.fire({
    icon: 'error',
    title: message,
  });
};

// Warning popup message
export const showWarning = (message) => {
  return Toast.fire({
    icon: 'warning',
    title: message,
  });
};

// Info popup message
export const showInfo = (message) => {
  return Toast.fire({
    icon: 'info',
    title: message,
  });
};

// Confirmation dialog (dark themed)
export const showConfirm = ({
  title = 'Are you sure?',
  text = '',
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  icon = 'warning',
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    background: '#1a1625',
    color: '#e2e8f0',
    confirmButtonColor: '#9333ea',
    cancelButtonColor: '#4b5563',
    customClass: {
      popup: 'swal-dark-popup',
      title: 'swal-dark-title',
      htmlContainer: 'swal-dark-text',
      confirmButton: 'swal-dark-confirm',
      cancelButton: 'swal-dark-cancel',
    },
  });
};

// Delete confirmation (red themed)
export const showDeleteConfirm = ({
  title = 'Delete?',
  text = 'This action cannot be undone.',
  confirmButtonText = 'Yes, Delete',
}) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    background: '#1a1625',
    color: '#e2e8f0',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#4b5563',
    customClass: {
      popup: 'swal-dark-popup',
      title: 'swal-dark-title',
      htmlContainer: 'swal-dark-text',
    },
  });
};
