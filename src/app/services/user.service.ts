import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUsers(): Observable<{ status: number; message: string; data: User[] }> {
    return of({
      status: 200,
      message: 'Success',
      data: [
        { id: 1, username: 'Nguyễn Văn A' },
        { id: 2, username: 'Trần Thị B' },
        { id: 3, username: 'Lê Văn C' },
        { id: 4, username: 'Donald Trump' }
      ]
    });
  }
}
