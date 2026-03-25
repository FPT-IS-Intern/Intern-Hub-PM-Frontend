import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-modal.component.html',
  styleUrl: './notification-modal.component.scss'
})
export class NotificationModalComponent {
  notificationService = inject(NotificationService);

  state = this.notificationService.state;

  onConfirm() {
    const currentState = this.state();
    if (currentState.onConfirm) {
      currentState.onConfirm();
    }
    this.notificationService.close();
  }

  onCancel() {
    const currentState = this.state();
    if (currentState.onCancel) {
      currentState.onCancel();
    }
    this.notificationService.close();
  }
}
