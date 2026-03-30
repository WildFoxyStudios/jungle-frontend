'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Product {
  id: string;
  title: string;
  seller?: { username: string };
  price: number;
  category: string;
  status?: string;
  created_at: string;
  [key: string]: unknown;
}

function formatPrice(price: number): string {
  return `$${Number(price).toFixed(2)}`;
}

export default function MarketplacePage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await adminApi.get<Product[] | { products?: Product[]; data?: Product[] }>(
          '/api/marketplace/products',
        );
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.products ?? raw.data ?? []);
        setProducts(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load products';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [toast]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/marketplace/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast('Product deleted successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast(message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Product) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row: Product) => <span className="text-white font-medium">{row.title}</span>,
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (row: Product) => (
        <span className="text-gray-300">{row.seller?.username ?? '—'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (row: Product) => (
        <span className="text-green-400 font-medium">{formatPrice(row.price)}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row: Product) => <span className="text-gray-300">{row.category}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Product) => {
        const status = row.status ?? 'active';
        return <Badge variant={status}>{status}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Product) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Product) => (
        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Marketplace</h1>

      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['title'] as (keyof Product)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Product"
        description={`Are you sure you want to delete the product "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
