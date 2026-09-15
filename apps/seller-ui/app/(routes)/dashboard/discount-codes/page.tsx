"use client"

import { apiRequest } from '@/shared/utils/fetch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus, Trash2, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

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
            return await apiRequest<{ success: boolean; discountCodes: any[] }>(
                '/api/products/product/get-discount-codes',
            ); 
        },
        staleTime: 1000 * 60 * 5,
        retry: 2,
    })

    const discountCodes = data?.discountCodes || [];

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
        }
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
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
                <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'>
                    <div className='bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-[450px] shadow-2xl'> 
                        <div className='flex justify-between items-center border-b border-gray-800 pb-4 mb-4'>
                            <h3 className='text-xl text-white font-semibold'>
                                Create Discount Code
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-white transition'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateSubmit} className='flex flex-col gap-4'>
                            <div>
                                <label className='block text-sm text-gray-300 mb-1'>Public Name (e.g. Summer Sale)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.public_name}
                                    onChange={(e) => setFormData({...formData, public_name: e.target.value})}
                                    className='w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500'
                                    placeholder="Summer Sale 2024"
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm text-gray-300 mb-1'>Type</label>
                                    <select 
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                                        className='w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500'
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Flat Amount ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm text-gray-300 mb-1'>Value</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                                        className='w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500'
                                        placeholder={formData.discountType === 'percentage' ? "20" : "15"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm text-gray-300 mb-1'>Discount Code</label>
                                <div className='flex gap-2'>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.discountCode}
                                        onChange={(e) => setFormData({...formData, discountCode: e.target.value.toUpperCase()})}
                                        className='w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500'
                                        placeholder="SUMMER20"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleGenerateDiscountCode}
                                        className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition whitespace-nowrap'
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            <div className='flex justify-end gap-3 mt-4'>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className='px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition'
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50'
                                >
                                    {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                    {createMutation.isPending ? 'Saving...' : 'Create'}
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