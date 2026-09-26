"use client"

import React, { useMemo, useState } from 'react'
import {
    useTable,
    createCoreRowModel,
    createFilteredRowModel,
    flexRender,
    filterFn_includesString,
} from '@tanstack/react-table'
import {
    Search, Pencil,
    Trash, Eye,
    Plus, BarChart,
    Star, ChevronRight,
    RefreshCw
} from "lucide-react"
import Link from 'next/link'
// import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/shared/utils/fetch'
import Image from 'next/image'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'

const fetchProducts = async () => {
    // 1. FIXED: Changed endpoint from the image upload URL to a proper fetch URL
    const res = await apiRequest<{
        success: boolean, 
        products: any
    }>(`/api/products/product/get-shop-products?t=${new Date().getTime()}`) 
    return res?.products;
}

const deleteProduct = async (productId: string) => {
    await apiRequest<{
        message: string, 
        deletedAt: Date
    }>(
        `/api/products/product/delete-product/${productId}`,
        { method: 'DELETE' } 
    )
}

const restoreProduct = async (productId: string) => {
    await apiRequest<{
        message: string
    }>(
        `/api/products/product/restore-product/${productId}`,
        { method: 'PUT' }
    )
}

const ProductPage = () => {
    const queryClient = useQueryClient()
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<any>()
    const [showDeleteModal, setShowDeleteModal] = useState(false )
    const [analyticsData, setAnalyticsData] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const { 
        data: products = [], 
        isLoading 
    } = useQuery({
        queryKey: ["shop-products"], // 2. FIXED: Changed duplicate 'queryFn' to 'queryKey'
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 5
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shop-products"] });
        }
    })

    const restoreMutation = useMutation({
        mutationFn: restoreProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shop-products"] });
        }
    })

    const columns = useMemo(() => [
        {
            accessorKey: "image",
            header: "Image",
            cell: ({row}: any) => {
                // 4. FIXED: Properly map your nested images array from the Prisma schema
                const imageUrl = row.original.images?.[0]?.url || "";

                return (
                    <Image 
                        src={imageUrl}
                        alt={row.original.title || "Product Image"}
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-md object-cover bg-gray-800'
                    />
                )
            }
        },
        {
            accessorKey: "name",
            header: "Product Name",
            cell: ({row}: any) => {
                const truncatedTitle = 
                row.original.title?.length > 25 
                    ? `${row.original.title.substring(0, 25)} ...`
                    : row.original.title;

                return (
                    <Link
                        href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                        className='text-blue-400 hover:underline'
                        title={row.original.title}
                    >
                        {truncatedTitle}
                    </Link>
                )
            }
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({row}: any) => (
                <span>
                    {row.original.sale_price}
                </span>
            )
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({row}: any) => (
                <span 
                    className={row.original.stock < 10 ? "text-red-500" : "text-white"}
                >
                    {row.original.stock} left
                </span>
            )
        },
        {
            accessorKey: "category",
            header: "Category",
        },
        {
            accessorKey: "rating",
            header: "Rating",
            cell: ({row}: any) => (
                <div 
                    className="flex items-center gap-1 text-yellow-400"
                >
                    <Star fill="#fde047" size={18} />
                    {" "}
                    <span className='text-white '>
                        {row.original.ratings || 5}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: any) => (
                <div className="flex gap-3">
                    <Link
                        href={`/product/{row.original.id}`}
                        className='text-blue-400 hover:text-blue-400 transition'
                    >
                        <Eye size={18}  />
                    </Link>
                    <Link
                        href={`/product/edit/{row.original.id}`}
                        className='text-yellow-400 hover:text-yellow-300 transition'
                    >
                        <Pencil size={18} />
                    </Link>
                    
                    <button
                        className="text-green-400 hover:text-green-300 transition"
                        // onClick={() => openAnalytics(row.original)}
                    >
                        <BarChart size={18} />
                    </button>
                    <button
                        className={`${row.original.isDeleted ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'} transition`}
                        onClick={() => openDeleteModal(row.original)}
                        title={row.original.isDeleted ? "Restore Product" : "Delete Product"}
                    >
                        {row.original.isDeleted ? <RefreshCw size={18} /> : <Trash size={18} />}
                    </button>
                </div>
            )
        }
    ], [])

    const table = useTable({
        data: products,
        columns,
        coreRowModel: createCoreRowModel(),
        filteredRowModel: createFilteredRowModel(),
        globalFilterFn: filterFn_includesString,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter
    })
    
    const openDeleteModal = (product: any) => {
        setSelectedProduct(product)
        setShowDeleteModal(true)
    }

  return (
    <div className='w-full min-h-screen p-8 text-white'>
        <div className='flex justify-between items-center mb-1'>
            <h2 className="text-2xl py-2 font-semibold font-poppins text-white">
                All Products
            </h2>
            <Link 
                href="/dashboard/products/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
                <Plus size={18} className="opacity-[0.8]" />
                <span>Create Product</span>
            </Link>
        </div>

        <div className='flex items-center mb-6 text-sm'>
            <Link 
                href="/dashboard" 
                className="text-blue-400 hover:underline cursor-pointer"
            >
                Dashboard
            </Link>
            <ChevronRight size={16} className="opacity-[0.6] mx-2" />
            <span className='text-gray-300'>All Products</span>
        </div>

        <div className='mb-6 flex items-center bg-[#18181b] p-3 rounded-lg border border-gray-800'>
            <Search size={18} className='text-gray-400 mr-3' />
            <input 
                type="text"
                placeholder='Search Products ...'
                className='w-full bg-transparent text-white outline-none'
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
            />
        </div>

        <div className="bg-[#18181b] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#111] border-b border-gray-800 text-gray-400 text-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="py-4 px-6 font-medium uppercase tracking-wider">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                                    Loading products...
                                </td>
                            </tr>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                                    {row.getAllCells().map((cell) => (
                                        <td key={cell.id} className="py-4 px-6">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>


                {showDeleteModal && (
                    <DeleteConfirmationModal 
                        product={selectedProduct}
                        onClose={() => {
                            setShowDeleteModal(false);
                            deleteMutation.reset();
                            restoreMutation.reset();
                        }}
                        onConfirm={() => deleteMutation.mutate(selectedProduct?.id)}
                        onRestore={() => restoreMutation.mutate(selectedProduct?.id)}
                        processing={deleteMutation.isPending || restoreMutation.isPending}
                        isSuccess={deleteMutation.isSuccess || restoreMutation.isSuccess}
                    />
                )}

            </div>
        </div>
    </div>
  )
}

export default ProductPage