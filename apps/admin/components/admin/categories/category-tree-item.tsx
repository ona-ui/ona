"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ComponentIcon
} from "lucide-react"
import { ActiveBadge } from "../status-badge"
import type { FullCategory } from "@workspace/types/categories"

interface CategoryTreeItemProps {
  category: FullCategory
  onEditCategory: (category: FullCategory) => void
  onDeleteCategory: (category: FullCategory) => void
  onCreateSubcategory: (categoryId: string) => void
  onEditSubcategory: (subcategory: any) => void
  onDeleteSubcategory: (subcategory: any) => void
}

export function CategoryTreeItem({
  category,
  onEditCategory,
  onDeleteCategory,
  onCreateSubcategory,
  onEditSubcategory,
  onDeleteSubcategory
}: CategoryTreeItemProps) {
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <div className="border rounded-lg overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                {isOpen ? (
                  <FolderOpenIcon className="h-5 w-5 text-blue-500" />
                ) : (
                  <FolderIcon className="h-5 w-5 text-blue-500" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{category.name}</span>
                    <ActiveBadge isActive={category.isActive} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.slug} • {category.subcategoryCount} sous-catégories • {category.componentCount} composants
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {category.subcategoryCount} sous-catégories
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {category.componentCount} composants
              </Badge>
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateSubcategory(category.id)
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditCategory(category)
                  }}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteCategory(category)
                  }}
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t bg-muted/20">
            {category.subcategories && category.subcategories.length > 0 ? (
              <div className="divide-y">
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="flex items-center justify-between p-3 pl-12">
                    <div className="flex items-center space-x-3">
                      <ComponentIcon className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{subcategory.name}</span>
                          <ActiveBadge isActive={subcategory.isActive} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {subcategory.slug} • {subcategory.componentCount} composants
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {subcategory.componentCount} composants
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSubcategory(subcategory)}
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteSubcategory(subcategory)}
                        >
                          <TrashIcon className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <ComponentIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune sous-catégorie</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onCreateSubcategory(category.id)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Créer la première sous-catégorie
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}