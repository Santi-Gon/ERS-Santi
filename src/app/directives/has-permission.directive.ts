import { Directive, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private permissions: string | string[] = [];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {
    // We can use an effect if we expect permissions to change dynamically, 
    // but for now we'll just evaluate when the input is set.
  }

  @Input()
  set appHasPermission(val: string | string[]) {
    this.permissions = val;
    this.updateView();
  }

  private updateView() {
    if (this.permissionService.hasPermission(this.permissions)) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
