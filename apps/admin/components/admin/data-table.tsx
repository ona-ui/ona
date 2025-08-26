"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Button
} from "@workspace/ui/components/button"
import {
  Input
} from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Checkbox
} from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Badge
} from "@workspace/ui/components/badge"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchIcon,
  MoreHorizontalIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon
} from "lucide-react"

export interface DataTableColumn<T> {
  key: keyof T | string
  title: string
  width?: string
  sortable?: boolean
  searchable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

export interface DataTableAction<T> {
  key: string
  label: string
  icon?: React.ElementType
  onClick: (item: T) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  show?: (item: T) => boolean
}

export interface DataTableBatchAction<T> {
  key: string
  label: string
  icon?: React.ElementType
  onClick: (items: T[]) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  show?: (items: T[]) => boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  actions?: DataTableAction<T>[]
  batchActions?: DataTableBatchAction<T>[]
  searchable?: boolean
  filterable?: boolean
  selectable?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
  }
  sorting?: {
    field: string
    direction: "asc" | "desc"
    onSort: (field: string, direction: "asc" | "desc") => void
  }
  loading?: boolean
  emptyMessage?: string
  className?: string
  getItemId: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  actions = [],
  batchActions = [],
  searchable = true,
  filterable = false,
  selectable = false,
  pagination,
  sorting,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  className,
  getItemId
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())

  // Filtrer les données en fonction de la recherche
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data
    
    return data.filter(item => {
      return columns.some(column => {
        if (!column.searchable) return false
        const value = column.key === 'actions' ? '' : String((item as any)[column.key] || '')
        return value.toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
  }, [data, searchTerm, columns])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredData.map(item => getItemId(item)))
      setSelectedItems(allIds)
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const selectedItemsArray = filteredData.filter(item => 
    selectedItems.has(getItemId(item))
  )

  const isAllSelected = filteredData.length > 0 && selectedItems.size === filteredData.length
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredData.length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {searchable && (
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
          
          {filterable && (
            <Button variant="outline" size="sm">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          )}
        </div>

        {/* Actions par lot */}
        {selectable && selectedItems.size > 0 && batchActions.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedItems.size} sélectionné(s)
            </Badge>
            {batchActions.map((action) => {
              const show = action.show ? action.show(selectedItemsArray) : true
              if (!show) return null

              const Icon = action.icon
              return (
                <Button
                  key={action.key}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => action.onClick(selectedItemsArray)}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Sélectionner tout"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={column.className}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && sorting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const newDirection = 
                            sorting.field === column.key && sorting.direction === "asc" 
                              ? "desc" 
                              : "asc"
                          sorting.onSort(String(column.key), newDirection)
                        }}
                      >
                        {sorting.field === column.key ? (
                          sorting.direction === "asc" ? (
                            <SortAscIcon className="h-4 w-4" />
                          ) : (
                            <SortDescIcon className="h-4 w-4" />
                          )
                        ) : (
                          <SortAscIcon className="h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-20">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const itemId = getItemId(item)
                const isSelected = selectedItems.has(itemId)
                
                return (
                  <TableRow key={itemId} data-state={isSelected ? "selected" : undefined}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectItem(itemId, !!checked)}
                          aria-label={`Sélectionner ${itemId}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={String(column.key)} className={column.className}>
                        {column.render ? (
                          column.render((item as any)[column.key], item)
                        ) : (
                          String((item as any)[column.key] || '')
                        )}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, index) => {
                              const show = action.show ? action.show(item) : true
                              if (!show) return null

                              const Icon = action.icon
                              return (
                                <React.Fragment key={action.key}>
                                  <DropdownMenuItem
                                    onClick={() => action.onClick(item)}
                                    className={action.variant === "destructive" ? "text-red-600" : ""}
                                  >
                                    {Icon && <Icon className="h-4 w-4 mr-2" />}
                                    {action.label}
                                  </DropdownMenuItem>
                                  {index < actions.length - 1 && <DropdownMenuSeparator />}
                                </React.Fragment>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Affichage de {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} à{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} éléments
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Lignes par page</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(value) => pagination.onLimitChange(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page <= 1}
              >
                <ChevronsLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.limit))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              >
                <ChevronsRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}