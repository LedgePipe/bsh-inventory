import { jsPDF } from 'jspdf'

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number
    }
  }
}

declare module 'jspdf-autotable' {
  export interface UserOptions {
    startY?: number
    head?: any[][]
    body?: any[][]
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: {
      fillColor?: number[]
      textColor?: number | number[]
      fontStyle?: string
    }
    columnStyles?: {
      [key: number]: {
        cellWidth?: number | 'auto' | 'wrap'
        halign?: 'left' | 'center' | 'right'
        fontStyle?: string
      }
    }
    styles?: {
      fontSize?: number
    }
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void
}
