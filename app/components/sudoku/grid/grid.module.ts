import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from './grid.component';

@NgModule({
  imports: [CommonModule, GridComponent],
  exports: [GridComponent]  
})

export class GridModule {}
