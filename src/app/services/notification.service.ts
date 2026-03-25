import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'warning' | 'error' | 'confirm';

export interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  state = signal<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  showSuccess(title: string, message: string = '', confirmText: string = 'Đóng', onConfirm?: () => void) {
    this.state.set({
      show: true,
      type: 'success',
      title,
      message,
      confirmText,
      onConfirm
    });
  }

  showError(title: string, message: string = '', confirmText: string = 'Đồng ý', cancelText: string = 'Quay lại', onConfirm?: () => void, onCancel?: () => void) {
    this.state.set({
      show: true,
      type: 'error',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  }

  showConfirm(title: string, message: string = '', confirmText: string = 'Xác nhận', cancelText: string = 'Thoát', onConfirm?: () => void, onCancel?: () => void) {
    this.state.set({
      show: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  }

  showWarning(title: string, message: string = '', confirmText: string = 'Xác nhận', cancelText: string = 'Thoát', onConfirm?: () => void, onCancel?: () => void) {
    this.state.set({
      show: true,
      type: 'warning',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  }

  close() {
    this.state.update(s => ({ ...s, show: false }));
  }
}
