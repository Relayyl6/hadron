"use client"

import { apiRequest } from '@/shared/utils/fetch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus, Trash2, X, Loader2, Wand2 } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'react-toastify'

const DiscountPage = () => {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    
    // Form state for creating a new discount
    const [formData, setFormData] = useState({
        public_name: '',
        discountType: 'percentage',
        discountValue: '',
        discountCode: ''
    });

    // 1. Fetch Discounts
    const { data, isLoading, isError } = useQuery({
        queryKey: ["shop-discounts"],
        queryFn: async () => {
            return await apiRequest<{ success: boolean; discount_codes: any[] }>(
                '/api/products/product/get-discount-codes',
            ); 
        },
        staleTime: 1000 * 60 * 5,
        retry: 2,
    })

    const discountCodes = data?.discount_codes || [];

    // 2. Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await apiRequest<{ success: boolean; message: string }>(
                `/api/products/product/delete-discount-code/${id}`,
                { method: 'DELETE' } 
            ); 
        },
        onSuccess: () => {
            // Refresh the table instantly
            queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
            toast.success("Discount code deleted successfully!");
        }
    });

    // 3. Create Mutation
    const createMutation = useMutation({
        mutationFn: async (newDiscount: typeof formData) => {
            return await apiRequest<{ success: boolean; message: string }>(
                '/api/products/product/create-discount-codes',
                { 
                    method: 'POST', 
                    body: JSON.stringify(newDiscount) 
                } // Adjust based on how your apiRequest wrapper handles POST requests
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
            setShowModal(false);
            setFormData({ public_name: '', discountType: 'percentage', discountValue: '', discountCode: '' }); // Reset form
            toast.success("Discount code created successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create discount code");
        }
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        if (discountCodes.length >= 8) {
            toast.error("You are only allowed to create up to 8 discount codes")
            return;
        }
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleGenerateDiscountCode = () => {
        // Assuming 'public_name' is the field you want to base it on
        const publicName = formData.public_name;
        let generatedCode = '';

        if (publicName && publicName.trim() !== '') {
            // 1. Generate based on public name
            const baseString = publicName
            // Normalize accents (e.g., "Café" -> "Cafe")
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            // Remove all spaces and special characters (keep only letters and numbers)
            .replace(/[^a-zA-Z0-9]/g, '')
            // Convert to uppercase
            .toUpperCase()
            // Limit length to keep the code manageable
            .slice(0, 10);

            // Append a 4-character random string to prevent duplicates (e.g., SUMMERSALE8F2A)
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            generatedCode = `${baseString}${randomSuffix}`;

        } else {
            // 2. Generate a completely random 8-character code if no name is provided
            generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        }

        // Set the value and trigger validation immediately
        setFormData(prevData => ({
            ...prevData,
            discountCode: generatedCode
        }));
    };

    return (
        <div className='w-full min-h-screen p-8'>
            <div className='flex justify-between items-center mb-1'>
                <h2 className='text-2xl text-white font-semibold'>
                    Discount Codes
                </h2>
                <button 
                    className='bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg flex items-center gap-2'
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={18} />
                    <span>Create Discount</span>
                </button>
            </div>

            {/* BreadCrumbs */}
            <div className='flex items-center gap-2 mt-2'>
                <Link href="/dashboard" className='text-[#80Deea] hover:underline cursor-pointer'>
                    Dashboard
                </Link>
                <ChevronRight size={16} className='opacity-[0.8] text-gray-400' />
                <span className='text-gray-400'>Discount Codes</span>
            </div>

            <div className='mt-8 bg-gray-900 p-6 rounded-lg shadow-lg'>
                <h3 className='text-lg font-semibold text-white mb-4'>
                    Your Discount Codes
                </h3>
                
                {isError && (
                    <p className='text-red-400 mb-4'>Failed to load discount codes. Please try again.</p>
                )}

                {isLoading ? (
                    <div className='flex justify-center items-center py-8'>
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-white min-w-[600px]'>
                            <thead>
                                <tr className='border-b border-gray-800 text-gray-400'>
                                    <th className='p-3 text-left font-medium'>Title</th>
                                    <th className='p-3 text-left font-medium'>Type</th>
                                    <th className='p-3 text-left font-medium'>Value</th>
                                    <th className='p-3 text-left font-medium'>Code</th>
                                    <th className='p-3 text-left font-medium'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discountCodes?.map((discount: any) => (
                                    <tr
                                        key={discount?.id}
                                        className='border-b border-gray-800 hover:bg-gray-800/50 transition'
                                    >   
                                        <td className='p-3'>{discount?.public_name}</td>
                                        <td className='p-3'>
                                            <span className='px-2 py-1 rounded bg-gray-800 text-xs uppercase tracking-wider text-gray-300'>
                                                {discount.discountType}
                                            </span>
                                        </td>
                                        <td className='p-3'>
                                            {discount.discountType === "percentage" ? `${discount.discountValue}%` : `$${discount.discountValue}`}
                                        </td>
                                        <td className='p-3'>
                                            <span className='font-mono text-blue-400'>{discount.discountCode}</span>
                                        </td>
                                        <td className='p-3'>
                                            <button
                                                disabled={deleteMutation.isPending}
                                                onClick={() => deleteMutation.mutate(discount.id)}
                                                className='text-gray-400 hover:text-red-400 disabled:opacity-50 transition p-2 rounded-md hover:bg-gray-800'
                                                title="Delete code"
                                            >
                                                {deleteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {!isLoading && discountCodes.length === 0 && !isError && (
                    <div className='text-gray-400 text-center w-full py-12 block bg-gray-800/20 rounded-lg mt-4'>
                        <p>No Discount Codes available</p>
                        <p className='text-sm mt-1'>Click "Create Discount" to add your first one.</p>
                    </div>
                )}
            </div>

            {/* Create Discount Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#18181b] border border-gray-800 p-7 rounded-2xl w-full max-w-[450px] shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl text-white font-semibold tracking-tight">
                        Create Discount Code
                        </h3>
                        <button
                        onClick={() => setShowModal(false)}
                        className="p-2 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-colors"
                        >
                        <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5">
                        {/* Public Name */}
                        <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                            Public Name (e.g. Summer Sale)
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.public_name}
                            onChange={(e) => {
                            const capitalizedValue = e.target.value.replace(/\b\w/g, (char) => char.toUpperCase());
                            setFormData({ ...formData, public_name: capitalizedValue });
                            }}
                            className="w-full bg-[#0f0f11] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="Summer Sale 2024"
                        />
                        </div>

                        {/* Type and Value Grid */}
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Type
                            </label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="w-full bg-[#0f0f11] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Flat Amount ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Value
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                className="w-full bg-[#0f0f11] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder={formData.discountType === 'percentage' ? "20" : "15"}
                            />
                        </div>
                        </div>

                        {/* Discount Code */}
                        <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                            Discount Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={formData.discountCode}
                                onChange={(e) => setFormData({ ...formData, discountCode: e.target.value.toUpperCase() })}
                                className="flex-1 bg-[#0f0f11] border border-gray-800 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="SUMMER20"
                                />
                                <button
                                type="button"
                                onClick={handleGenerateDiscountCode}
                                className="px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition-colors flex items-center justify-center group"
                                title="Auto-generate from Title"
                            >
                            <Wand2 size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-800/50">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 active:scale-[0.98]"
                        >
                            {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                            {createMutation.isPending ? 'Saving...' : 'Create Code'}
                        </button>
                        </div>
                    </form>
                    </div>
                </div>
                )}
        </div>
    )
}

export default DiscountPage