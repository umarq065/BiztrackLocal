"use client";

import { useState, memo, useEffect } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import NProgressLink from "@/components/layout/nprogress-link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { IncomeSource, Gig } from "@/lib/data/incomes-data";
import { Skeleton } from "@/components/ui/skeleton";
import { IncomeSourceGrid } from "./income-source-grid";
import { AddSourceDialog } from "./dialogs/add-source-dialog";
import { AddGigDialog } from "./dialogs/add-gig-dialog";
import { EditGigDialog } from "./dialogs/edit-gig-dialog";
import { AddSourceDataDialog } from "./dialogs/add-source-data-dialog";
import { AddGigDataDialog } from "./dialogs/add-gig-data-dialog";
import { MergeGigsDialog } from "./dialogs/merge-gigs-dialog";
import { DeleteGigDialog } from "./dialogs/delete-gig-dialog";
import { EditSourceDialog } from "./dialogs/edit-source-dialog";
import { ImportGigDataDialog } from "./dialogs/import-gig-data-dialog";

export function IncomesDashboard() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);
  const [isEditSourceDialogOpen, setIsEditSourceDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  const [addGigDialogOpen, setAddGigDialogOpen] = useState(false);
  const [addingToSourceId, setAddingToSourceId] = useState<string | null>(null);

  const [editGigDialogOpen, setEditGigDialogOpen] = useState(false);
  const [editingGigInfo, setEditingGigInfo] = useState<{ sourceId: string; gig: Gig } | null>(null);

  const [isAddDataDialogOpen, setIsAddDataDialogOpen] = useState(false);
  const [updatingSource, setUpdatingSource] = useState<IncomeSource | null>(null);

  const [isAddGigDataDialogOpen, setIsAddGigDataDialogOpen] = useState(false);
  const [updatingGigInfo, setUpdatingGigInfo] = useState<{ source: IncomeSource; gig: Gig } | null>(null);

  const [gigToDelete, setGigToDelete] = useState<{ gig: Gig, sourceId: string } | null>(null);

  const [sourceToDelete, setSourceToDelete] = useState<IncomeSource | null>(null);
  const [isDeletingSource, setIsDeletingSource] = useState(false);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const fetchIncomeSources = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/incomes');
      if (!response.ok) {
        throw new Error('Failed to fetch income sources');
      }
      const data = await response.json();
      setIncomeSources(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load income sources. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeSources();
  }, [toast]);

  const handleSourceAdded = (newSource: IncomeSource) => {
    setIncomeSources(prev => [newSource, ...prev]);
  };

  const handleSourceUpdated = (updatedSource: IncomeSource) => {
    setIncomeSources(prev => prev.map(s => s.id === updatedSource.id ? updatedSource : s));
  };

  const handleGigAdded = (newGig: Gig, sourceId: string) => {
    setIncomeSources(prev =>
      prev.map(source => {
        if (source.id === sourceId) {
          return { ...source, gigs: [...source.gigs, newGig].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
        }
        return source;
      })
    );
  };

  const handleGigUpdated = (updatedGig: Gig, sourceId: string) => {
    setIncomeSources(prev =>
      prev.map(source => {
        if (source.id === sourceId) {
          return {
            ...source,
            gigs: source.gigs.map(g => g.id === updatedGig.id ? updatedGig : g),
          };
        }
        return source;
      })
    );
  };

  const handleDeleteGig = async (gig: Gig, sourceId: string) => {
    setIncomeSources(prev =>
      prev.map(source => {
        if (source.id === sourceId) {
          return { ...source, gigs: source.gigs.filter(g => g.id !== gig.id) };
        }
        return source;
      })
    );
  };

  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;
    setIsDeletingSource(true);
    try {
      const response = await fetch(`/api/incomes/${sourceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete income source');
      }

      setIncomeSources(prev => prev.filter(s => s.id !== sourceToDelete.id));
      toast({ title: "Success", description: `Income source "${sourceToDelete.name}" deleted.` });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete the income source. Please try again.",
      });
    } finally {
      setIsDeletingSource(false);
      setSourceToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="ml-auto h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient-x">
            Income Sources
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your revenue streams in the digital frontier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="border-primary/50 text-primary hover:bg-primary/10 backdrop-blur-sm shadow-glow transition-all duration-300"
          >
            Import CSV
          </Button>
          <Button
            onClick={() => setIsAddSourceDialogOpen(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 font-semibold"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Source
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Your Portfolio</h2>
            <p className="text-muted-foreground">
              Overview of your active income sources and gigs.
            </p>
          </div>

          <IncomeSourceGrid
            incomeSources={incomeSources}
            onAddGig={(sourceId) => { setAddingToSourceId(sourceId); setAddGigDialogOpen(true); }}
            onAddSourceData={(source) => { setUpdatingSource(source); setIsAddDataDialogOpen(true); }}
            onAddGigData={(source, gig) => { setUpdatingGigInfo({ source, gig }); setIsAddGigDataDialogOpen(true); }}
            onEditSource={(source) => { setEditingSource(source); setIsEditSourceDialogOpen(true); }}
            onEditGig={(sourceId, gig) => { setEditingGigInfo({ sourceId, gig }); setEditGigDialogOpen(true); }}
            onDeleteGig={(sourceId, gig) => setGigToDelete({ sourceId, gig })}
            onDeleteSource={setSourceToDelete}
          />
        </div>
      </div>

      <AddSourceDialog
        open={isAddSourceDialogOpen}
        onOpenChange={setIsAddSourceDialogOpen}
        onSourceAdded={handleSourceAdded}
      />

      <EditSourceDialog
        open={isEditSourceDialogOpen}
        onOpenChange={setIsEditSourceDialogOpen}
        editingSource={editingSource}
        onSourceUpdated={handleSourceUpdated}
      />

      <AddGigDialog
        open={addGigDialogOpen}
        onOpenChange={setAddGigDialogOpen}
        sourceId={addingToSourceId}
        onGigAdded={handleGigAdded}
      />

      {editingGigInfo && (
        <EditGigDialog
          open={editGigDialogOpen}
          onOpenChange={setEditGigDialogOpen}
          editingGigInfo={editingGigInfo}
          onGigUpdated={handleGigUpdated}
        />
      )}

      {updatingSource && (
        <AddSourceDataDialog
          open={isAddDataDialogOpen}
          onOpenChange={setIsAddDataDialogOpen}
          source={updatingSource}
          onDataAdded={() => {
            // No need to update state here as messages are separate
          }}
        />
      )}

      {updatingGigInfo && (
        <AddGigDataDialog
          open={isAddGigDataDialogOpen}
          onOpenChange={setIsAddGigDataDialogOpen}
          updatingGigInfo={updatingGigInfo}
          onGigDataAdded={() => {
            // No need to update state here as performance data is separate
          }}
        />
      )}

      {gigToDelete && (
        <DeleteGigDialog
          gigToDelete={gigToDelete}
          onOpenChange={(open) => !open && setGigToDelete(null)}
          onGigDeleted={handleDeleteGig}
        />
      )}

      <AlertDialog open={!!sourceToDelete} onOpenChange={() => setSourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the income source "{sourceToDelete?.name}" and all of its associated gigs and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSource} disabled={isDeletingSource} className={cn(buttonVariants({ variant: "destructive" }))}>
              {isDeletingSource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportGigDataDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        incomeSources={incomeSources}
        onSuccess={fetchIncomeSources}
      />
    </main>
  );
}

const MemoizedIncomesDashboard = memo(IncomesDashboard);
