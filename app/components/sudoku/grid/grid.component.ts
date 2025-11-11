  import { Component, HostListener, EventEmitter, Input, Output } from '@angular/core';
  import { Sudoku, SudokuField } from '../sudokuField.component';
  import { CommonModule } from '@angular/common';

  const between = (newValue: number, min: number, max: number) => {
    return Math.min(Math.max(newValue, min), max);
  };

  @Component({
    selector: 'su-grid',
    standalone: true, 
    imports: [CommonModule],
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.css']
  })
  export class GridComponent {
    @Input() sudoku: Sudoku = [[]];
    @Input() activeField?: SudokuField;

    @Input() noteMode: boolean = false; 

    @Output() activeFieldChange = new EventEmitter<SudokuField | undefined>();

    onFieldClick(field: SudokuField): void 
    {
      this.activeField = this.activeField === field ? undefined : field;
      this.activeFieldChange.emit(this.activeField);
    }

    @HostListener('window:keydown.arrowUp') onArrowUp(): void 
    {
      this.moveFocus(-1, 0);
    }

    @HostListener('window:keydown.arrowDown') onArrowDown(): void 
    {
      this.moveFocus(1, 0);
    }

    @HostListener('window:keydown.arrowLeft') onArrowLeft(): void 
    {
      this.moveFocus(0, -1);
    }

    @HostListener('window:keydown.arrowRight') onArrowRight(): void 
    {
      this.moveFocus(0, 1);
    }

    get currentRow(): number 
    {
      if (!this.activeField) 
      {
        return -1;
      }

      return this.sudoku.findIndex(row => row.indexOf(this.activeField!) !== -1);
    }

    get currentCol(): number 
    {
      if (!this.activeField || this.currentRow === -1) 
      {
        return -1;
      }

      return this.sudoku[this.currentRow].indexOf(this.activeField);
    }

    private moveFocus(relativeCol = 0, relativeRow = 0): void 
    {
      if (!this.activeField) 
      {  
        const firstEditable = this.sudoku.flat().find(f => !f.readonly);
        if (firstEditable) 
        {
          this.activeFieldChange.emit(firstEditable);
        }
        return;
      }

      const newRow = between(this.currentRow + relativeRow, 0, 8);
      const newCol = between(this.currentCol + relativeCol, 0, 8);
      
      const newField = this.sudoku[newRow][newCol];

      this.activeFieldChange.emit(newField);
    }
  }