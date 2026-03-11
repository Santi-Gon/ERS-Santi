import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissions = signal<string[]>([]);

  constructor() {}

  /**
   * Set the initial permissions array.
   */
  setPermissions(permissions: string[]) {
    this.userPermissions.set(permissions);
  }

  /**
   * Check if the user has a specific permission or set of permissions.
   */
  hasPermission(permissionName: string | string[]): boolean {
    const permissions = this.userPermissions();
    if (Array.isArray(permissionName)) {
      // Return true if the user has AT LEAST ONE of the required permissions
      return permissionName.some(p => permissions.includes(p));
    }
    return permissions.includes(permissionName);
  }
}
