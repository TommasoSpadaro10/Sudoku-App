import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, NgZone  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sudoku, SudokuField } from './sudokuField.component';
import { GridComponent } from './grid/grid.component';

interface NumberButton 
{
  number: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, FormsModule, GridComponent],
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.css']
})

export class SudokuComponent implements OnChanges 
{
  @Input() sudoku: Sudoku = [[]];
  @Output() finish = new EventEmitter<void>();
  isSolvable: boolean = false;
  activeField?: SudokuField;
  progress: number = 0;
  noteMode: boolean = false;
  currentMode: 'play' | 'create' = 'play'; 

  numberButtons: NumberButton[] = [
    {number: 1},
    {number: 2},
    {number: 3},
    {number: 4},
    {number: 5},
    {number: 6},
    {number: 7},
    {number: 8},
    {number: 9}
  ];

  constructor(private zone: NgZone) {}

  ngOnInit(): void 
  {
    this.progress=0;
    this.sudoku = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ answer: 0 } as SudokuField)));
    this.onPlayClick();
  }

  public onPlayClick(): void 
  {
    this.currentMode = 'play';
    this.noteMode = false;
    this.generateAndLoadRandomPuzzle(10);
  }

  public onCreateClick(): void 
  {
    this.currentMode = 'create';
    this.noteMode = false;
    this.createBlankPuzzle();
  }

  ngOnChanges(changes: SimpleChanges): void 
  {
    if (changes['sudoku'] && changes['sudoku'].currentValue) 
    {
        this.onPlayClick();
    }
  }

  @HostListener('window:keydown.space', ['$event']) onSpace(event: Event) 
  {
    event.preventDefault();
    
    if(this.currentMode === "create")
      return;
    
    this.noteMode = !this.noteMode;
  }

  @HostListener('window:keydown.backspace') onBackspace(): void 
  {
    this.erase();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) 
  {
    const number = parseInt(event.key, 10);

    if (!this.activeField || isNaN(number) || number < 1 || number > 9) 
    {
      return;
    }

    this.insertNumber(number);
  }

  erase(): void 
  {
    if (this.activeField && !this.activeField.readonly) 
    {
      this.activeField.notes = [];
      this.activeField.value = undefined;
      this.updateProgress();
      this.checkNumbers();

      if (this.currentMode === 'create') 
      {
       this.checkSolvability();
      }
    }
  }

  note(): void
  {
    this.zone.run(() => {
      this.noteMode = !this.noteMode;
    });
  }

  hint(): void 
  {
    if (this.currentMode !== 'play' || !this.activeField || this.activeField.readonly) 
    {
        return;
    }

    this.activeField.value = this.activeField.answer;
    this.cleanNotes();
    this.checkNumbers();
    this.updateProgress();
    this.checkFinished();
  }

  public solveSudoku(): void 
  {
    const boardToSolve = this.sudoku.map(row => 
        row.map(cell => (cell.value ? cell.value : 0))
      );
    
    const isSolved = this.solve(boardToSolve);

    if (isSolved) 
      {
      this.sudoku.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
          cell.value = boardToSolve[rIndex][cIndex];
          cell.notes = []; 
        });
      });

      this.updateProgress();
      this.checkNumbers();
      this.checkFinished();
    } 
  }

  insertNumber(number: number) 
  {
    const field = this.activeField;
    if (!field) 
    {
      return;
    }

    if (this.noteMode && !field.value) 
    {
      if (!field.notes) 
      {
        field.notes = [];
      }
      if (!field.notes.find(i => i === number)) 
      {
        field.notes = field.notes.concat(number);
      }
      else 
      {
        field.notes = field.notes.filter(i => i !== number);
      }
    } 
    else if (!this.noteMode && !field.readonly) 
    {
      field.value = number;

      if (this.currentMode === 'play') 
      {
          this.cleanNotes();
          this.checkFinished();
      }
    }

    this.updateProgress();
    this.checkNumbers();

    if (this.currentMode === 'create') 
    {
      if (!field.value) return;

      const board = this.sudoku.map(row => row.map(cell => (cell.value ? cell.value : 0)));
      const row = this.currentRow;
      const col = this.currentCol;

      console.log(this.isSolvable);
      board[row][col] = 0;
      this.isSolvable = this.isPlacementValid(
                          board, 
                          this.currentRow, 
                          this.currentCol, 
                          number);

      console.log(this.isSolvable);
    }
  }

  get currentRow(): number 
  {
    console.log(this.sudoku.findIndex(row => row.indexOf(this.activeField!)));
    return this.sudoku.findIndex(row => row.indexOf(this.activeField!) > -1);
  }

  get currentCol(): number 
  {
    if (!this.activeField || this.currentRow === -1) 
    {
      return -1;
    }

    return this.sudoku[this.currentRow].indexOf(this.activeField!);
  }

  private createBlankPuzzle(): void 
  {
    this.sudoku = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({
            value: undefined,
            answer: 0,
            readonly: false,
            notes: []
        }))
    );
    this.resetState();
  }

  private resetState(): void 
  {
      this.activeField = undefined;
      this.checkNumbers();
      this.updateProgress();
      this.isSolvable = true;
  }




  /*  =====================================
          Controllo se risolvibile
      ===================================*/


  private checkSolvability(): void 
  {
    const board = this.sudoku.map(row => row.map(cell => (cell.value ? cell.value : 0)));
    this.isSolvable = this.solve(board);
    console.log(this.isSolvable);
  }

  private findEmptySpot(board: number[][]): [number, number] | null 
  {
    for (let r = 0; r < 9; r++) 
    {
      for (let c = 0; c < 9; c++)
      {
        if (board[r][c] === 0) 
        {
          return [r, c];
        }
      }
    }
    
    return null;
  }

  private isPlacementValid(board: number[][], row: number, col: number, num: number): boolean 
  {
    for (let i = 0; i < 9; i++) 
    {
      if (board[row][i] === num && i !== col) 
      {
         console.log(num + " in row " + row + " not valid");
         return false;
      }
    }

    for (let i = 0; i < 9; i++) 
    {
      if (board[i][col] === num && i !== row) 
      {
        console.log(num + " in col " + col + " not valid");
        return false;
      }
    }

    const boxRowStart = row - (row % 3);
    const boxColStart = col - (col % 3);
    for (let r = 0; r < 3; r++)
    {
      for (let c = 0; c < 3; c++)
      {
        if(boxRowStart + r === row && boxColStart + c === col)
        {
          continue;
        }
        
        if (board[boxRowStart + r][boxColStart + c] === num) 
        {
          console.log(num  + " in box"+  boxColStart+c  + "/" + boxRowStart+r + " not valid" + row + "/" + col  );
          return false;
        }
      }
    } 

    return true;
  }



  private cleanNotes(): void 
  {
    if(!this.activeField || !this.activeField.value) return;

    const row = this.currentRow;
    const col = this.currentCol;
    
    if (row === -1 || col === -1) 
    {
        return;
    }

    const removeNote = (field: SudokuField) => {
      field.notes = field.notes ? field.notes.filter(n => n !== this.activeField?.value) : [];
    };

    this.sudoku[row].forEach(field => removeNote(field));
    this.sudoku.forEach(row => removeNote(row[col]));

    const firstCol = col - col % 3;
    const firstRow = row - row % 3;

    [0, 1, 2].forEach(rowOffset => {
      [0, 1, 2].forEach(colOffset => {
        removeNote(this.sudoku[firstRow + rowOffset][firstCol + colOffset]);
      });
    });
  }

  private checkNumbers(): void 
  {
    const countNumber = (i: number): number => {
      let count = 0;

      for (let row of this.sudoku) 
      {
        for (let cell of row) 
        {
          if (cell.value === i) 
          {
            count++;
          }
        }
      }
      return count;
    };


    this.numberButtons.forEach(button => 
      {
        button.disabled = countNumber(button.number) >= 9;
      });
  }

  private checkFinished(): void 
  {
    if (this.finished) 
    {
      this.finish.emit();
    }
  }

  private get finished(): boolean 
  {
    return this.sudoku.every(row => row.every(field => field.value === field.answer));
  }

  private updateProgress(): void 
  {
    let filledCells = 0;
    for (const row of this.sudoku) 
    {
      for (const field of row) 
      {
        if (field.value && field.value === field.answer) 
        { 
          filledCells++;
        }
      }
    }

    if(this.isSolvable)
    {
      this.progress = (filledCells / 81) * 100;
    }
  }

  public generateAndLoadRandomPuzzle(difficulty: number = 20) 
  { 
    const solution = this.generateFullSolution();

    if (solution) 
    {
      const puzzle = this.createPuzzleFromSolution(solution, difficulty);

      this.sudoku = puzzle.map((row, r) =>
        row.map((val, c) => ({
          value: val === 0 ? undefined : val,
          answer: solution[r][c],
          readonly: val !== 0,
          notes: []
        }))
      );
      this.resetState();
    }
  }

  private generateFullSolution(): number[][] | null 
  {
    const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.fillGrid(board);
    return board;
  }

  private fillGrid(board: number[][]): boolean 
  {
    const emptySpot = this.findEmptySpot(board);
    if (!emptySpot) 
    {
      return true;
    }

    const [row, col] = emptySpot;
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) 
    {
      if (this.isPlacementValid(board, row, col, num)) 
      {
        board[row][col] = num;
        if (this.fillGrid(board)) {
          return true;
        }
        board[row][col] = 0; 
      }
    }

    return false;
  }

  private createPuzzleFromSolution(solution: number[][], difficulty: number): number[][] 
  {
    const puzzle = JSON.parse(JSON.stringify(solution));
    let cellsToRemove = 81 - difficulty;

    while (cellsToRemove > 0) 
    {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (puzzle[row][col] !== 0) 
      {
        puzzle[row][col] = 0;
        cellsToRemove--;
      }
    }
    return puzzle;
  }

  private shuffleArray(array: any[]): any[] 
  {
    for (let i = array.length - 1; i > 0; i--) 
    {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }



  /*  =====================================
      Algorimo di risoluzione back propagation with set
      =====================================*/

  private solve(board: number[][]): boolean 
  {
    const rows  = Array.from({ length: 9 }, () => new Set<number>());
    const cols  = Array.from({ length: 9 }, () => new Set<number>());
    const boxes = Array.from({ length: 9 }, () => new Set<number>());

    for (let r = 0; r < 9; r++) 
    {
      for (let c = 0; c < 9; c++) 
      {
        const val = board[r][c];
        if (val !== 0) 
        {
          rows[r].add(val);
          cols[c].add(val);
          boxes[this.getBoxIndex(r, c)].add(val);
        }
      }
    }

    return this.solveWithSets(board, 0, 0, rows, cols, boxes);
  }

  private solveWithSets(
                          board: number[][],
                          row: number,
                          col: number,
                          rows: Set<number>[],
                          cols: Set<number>[],
                          boxes: Set<number>[]
                        ): boolean 
  {
    if (row === 9) return true; 

    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = (col + 1) % 9;

    if (board[row][col] !== 0) 
    {
      return this.solveWithSets(board, nextRow, nextCol, rows, cols, boxes);
    }

    const boxIndex = this.getBoxIndex(row, col);

    const candidates = this.getCandidates(row, col, rows, cols, boxes);

    for (const num of candidates) 
    {
      if (!rows[row].has(num) && !cols[col].has(num) && !boxes[boxIndex].has(num)) 
      {
        board[row][col] = num;
        rows[row].add(num);
        cols[col].add(num);
        boxes[boxIndex].add(num);

        if (this.solveWithSets(board, nextRow, nextCol, rows, cols, boxes)) 
        {
          return true;
        }

        board[row][col] = 0;
        rows[row].delete(num);
        cols[col].delete(num);
        boxes[boxIndex].delete(num);
      }
    }

    return false; 
  }

  private getBoxIndex(row: number, col: number): number 
  {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }

  private getCandidates(
                          row: number,
                          col: number,
                          rows: Set<number>[],
                          cols: Set<number>[],
                          boxes: Set<number>[]
                        ): number[] 
  {
    const boxIndex = this.getBoxIndex(row, col);
    const possible: number[] = [];

    for (let num = 1; num <= 9; num++) 
    {
      if(!rows[row].has(num) && !cols[col].has(num) && !boxes[boxIndex].has(num)) 
      {
        possible.push(num);
      }
    }
    
    return possible;
  }

}