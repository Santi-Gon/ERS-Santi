import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissions = signal<string[]>([]);
  private readonly PERMS_KEY = 'ers_permissions';

  constructor() {
    this.loadPermissions();
  }

  /**
   * Set the initial permissions array and save to localStorage.
   */
  setPermissions(permissions: string[]) {
    this.userPermissions.set(permissions);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.PERMS_KEY, JSON.stringify(permissions));
    }
  }

  /**
   * Load permissions from localStorage on app boot.
   */
  loadPermissions() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.PERMS_KEY);
      if (stored) {
        try {
          this.userPermissions.set(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }

  /**
   * Check if the user has a specific permission or set of permissions.
   */
  hasPermission(permissionName: string | string[]): boolean {
    const permissions = this.userPermissions();
    if (Array.isArray(permissionName)) {
      return permissionName.some(p => permissions.includes(p));
    }
    return permissions.includes(permissionName);
  }
}

