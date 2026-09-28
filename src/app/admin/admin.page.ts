import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonModal, IonInput, IonButtons } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { User } from '../interfaces/models';
import { addIcons } from 'ionicons';
import { create, trash, add, close } from 'ionicons/icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonModal, IonInput, IonButtons, CommonModule, FormsModule, RouterModule]
})
export class AdminPage implements OnInit {
  users: User[] = [];
  
  // Modal de edición
  isModalOpen = false;
  editingUser: User | null = null;
  editData = { id: 0, username: '', email: '' };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {
    addIcons({ create, trash, add, close });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        console.log("Usuarios cargados:", data);
        this.users = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando usuarios", err)
    });
  }

  deleteUser(id: number | undefined) {
    if (!id) return;
    if (confirm("¿Estás seguro de que deseas eliminar este usuario? (Esto también borrará su inventario).")) {
      this.apiService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert("Error eliminando usuario")
      });
    }
  }

  openEditModal(user: User) {
    if (!user.id) return;
    this.editingUser = user;
    this.editData = { id: user.id, username: user.username, email: user.email };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingUser = null;
  }

  saveEdit() {
    if (!this.editingUser?.id) return;
    
    // Convert to the model format
    const updatedUser: User = {
      username: this.editData.username,
      email: this.editData.email,
      // We don't change password here for simplicity, but could be added
    };

    this.apiService.updateUser(this.editingUser.id, updatedUser).subscribe({
      next: () => {
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => alert("Error actualizando usuario")
    });
  }
}
