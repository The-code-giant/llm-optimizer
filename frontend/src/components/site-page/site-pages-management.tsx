"use client";

import { CheckSquare, Square, Trash2, Plus, Search, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import AddSinglePageForm from "@/components/AddSinglePageForm";
import { Page, SiteDetails, GetPagesParams, GetPagesResponse, getPages } from "@/lib/api";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface SitePagesManagementProps {
  site: SiteDetails;
  siteId: string;
  refreshToken?: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "title" | "url" | "score" | "lastScanned" | "createdAt";
  setSortBy: (sort: "title" | "url" | "score" | "lastScanned" | "createdAt") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  scoreFilter: "all" | "high" | "medium" | "low";
  setScoreFilter: (filter: "all" | "high" | "medium" | "low") => void;
  selectedPages: Set<string>;
  setSelectedPages: (pages: Set<string>) => void;
  showAddPageModal: boolean;
  setShowAddPageModal: (show: boolean) => void;
  onRefresh: () => void;
  onDeletePage: (pageId: string) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  calculateOverallScore: (page: Page) => number;
  getToken: () => Promise<string | null>;
}

const ITEMS_PER_PAGE = 10;

export function SitePagesManagement({
  site,
  siteId,
  refreshToken,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  scoreFilter,
  setScoreFilter,
  selectedPages,
  setSelectedPages,
  showAddPageModal,
  setShowAddPageModal,
  onRefresh,
  onDeletePage,
  onBulkDelete,
  calculateOverallScore,
  getToken,
}: SitePagesManagementProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<Page[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch pages from server with current filters
  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const params: GetPagesParams = {
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
        scoreFilter: scoreFilter !== 'all' ? scoreFilter : undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      const response: GetPagesResponse = await getPages(token, siteId, params);
      setPages(response.pages);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, scoreFilter, currentPage, siteId, getToken]);

  // Fetch pages when filters or page changes
  useEffect(() => {
    fetchPages();
  }, [fetchPages, refreshToken]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, scoreFilter]);

  const handleSelectPage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map((page) => page.id)));
    }
  };

  const truncateTitle = (title: string, maxLength: number = 50) => {
    return title.length > maxLength ? title.substring(0, maxLength) + "..." : title;
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
  };

  return (
    <Card data-tour="pages-management">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>
              Pages ({total})
            </CardTitle>
            <CardDescription>
              Monitor and analyze your website pages
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Add New Page Button */}
            <Dialog
              open={showAddPageModal}
              onOpenChange={setShowAddPageModal}
            >
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center w-full sm:w-auto"
                  data-tour="add-new-page"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Page</DialogTitle>
                  <DialogDescription>
                    Add a new page to your site for analysis and optimization
                  </DialogDescription>
                </DialogHeader>
                {site && (
                  <AddSinglePageForm
                    siteId={siteId}
                    siteUrl={site.url}
                    onCompleted={() => {
                      setShowAddPageModal(false);
                      onRefresh();
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Bulk Actions */}
            {selectedPages.size > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">
                  {selectedPages.size} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 pt-4" data-tour="search-filters">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as "all" | "high" | "medium" | "low")}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background w-full sm:w-auto"
          >
            <option value="all">All Scores</option>
            <option value="high">High (75%+)</option>
            <option value="medium">Medium (60-74%)</option>
            <option value="low">Low (&lt;60%)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "title" | "url" | "score" | "lastScanned" | "createdAt")}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background w-full sm:w-auto"
          >
            <option value="createdAt">Sort by Created Date</option>
            <option value="title">Sort by Title</option>
            <option value="url">Sort by URL</option>
            <option value="score">Sort by Score</option>
            <option value="lastScanned">Sort by Last Scan</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="w-full sm:w-auto"
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 text-muted-foreground mx-auto mb-4">📄</div>
            <p className="text-muted-foreground">
              {searchTerm || scoreFilter !== "all"
                ? "No pages match your filters."
                : "No pages found. Import your sitemap to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select All */}
            <div className="flex items-center space-x-2 pb-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="p-1"
              >
                {selectedPages.size === pages.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Select All
              </span>
            </div>

            {/* Pages Table */}
            <div className="space-y-1">
              {pages.map((page) => {
                const pageScore = calculateOverallScore(page);
                return (
                  <div
                    key={page.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Checkbox */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectPage(page.id)}
                      className="p-1 flex-shrink-0"
                    >
                      {selectedPages.has(page.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="font-medium text-sm truncate cursor-help">
                                {truncateTitle(page.title || "Untitled Page")}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs break-words">
                                {page.title || "Untitled Page"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge
                          variant={
                            pageScore >= 75
                              ? "default"
                              : pageScore >= 60
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {pageScore}%
                        </Badge>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground truncate cursor-help">
                              {truncateUrl(page.url)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs break-all">
                              {page.url}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/dashboard/${siteId}/pages/${page.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Analysis
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeletePage(page.id)}
                        className="text-red-600 hover:text-red-800 border-red-300 hover:border-red-400 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col items-center gap-4 pt-4">
                {/* Pagination Controls */}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                          }
                        }}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            href="#" 
                            isActive={pageNum === currentPage}
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                          }
                        }}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                {/* Pagination Info */}
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {total} total pages
                </div>
              </div>
            )}
            
            {/* Show pagination info even when no pages */}
            {totalPages === 0 && !loading && (
              <div className="flex justify-center pt-4">
                <div className="text-sm text-muted-foreground">
                  Page 1 of 1 (0 total pages)
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
