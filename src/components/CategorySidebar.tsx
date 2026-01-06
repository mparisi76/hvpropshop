'use client';

import { useState } from 'react'; // Removed useEffect
import Link from 'next/link';
import { CategoryTree } from '@/types';

export default function CategorySidebar({ tree, selectedSlug }: { tree: CategoryTree, selectedSlug?: string }) {

	// 1. Initialize state with a "Lazy Initializer" function
	const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
		const initialOpen: Record<string, boolean> = {};

		if (selectedSlug) {
			// Find which parent contains this slug
			const parent = Object.values(tree).find(p =>
				p.slug === selectedSlug ||
				Object.values(p.children).some(c => c.slug === selectedSlug)
			);

			if (parent) {
				initialOpen[parent.slug] = true;
			}
		}

		return initialOpen;
	});

	// 2. We keep the toggle function for manual clicks
	const toggleSection = (slug: string) => {
		setOpenSections(prev => ({ ...prev, [slug]: !prev[slug] }));
	};

	// Sort parents alphabetically
	const sortedParents = Object.values(tree).sort((a, b) => a.name.localeCompare(b.name));

	return (
		<aside className="w-64 flex flex-col gap-2 select-none">
			{/* "All Props" Reset Button */}
			<div className="pb-4 border-b border-slate-100">
				<Link
					href="/"
					className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${!selectedSlug ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
						}`}
				>
					All Inventory
				</Link>
			</div>

			{sortedParents.map((parent) => {
				const isOpen = openSections[parent.slug];
				const hasChildren = Object.keys(parent.children).length > 0;
				const sortedChildren = Object.values(parent.children).sort((a, b) => a.name.localeCompare(b.name));

				return (
					<div key={parent.slug} className="flex flex-col">
						<div className="flex items-center justify-between group">
							<Link
								onClick={() => setOpenSections(prev => ({ 
									...prev, 
									[parent.slug]: true 
								}))}
								href={`/?category=${parent.slug}`}
								className={`font-bold uppercase text-[12px] tracking-widest transition-colors ${selectedSlug === parent.slug ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
									}`}
							>
								{parent.name} <span className="ml-1 font-medium">({parent.totalCount})</span>
							</Link>

							{hasChildren && (
								<button onClick={() => toggleSection(parent.slug)} className="p-1 hover:bg-slate-50 rounded">
									<svg
										className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={3}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
							)}
						</div>

						{hasChildren && (
							<div className={`flex flex-col gap-1 pl-3 border-l-2 border-slate-50 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-125 opacity-100 mt-1' : 'max-h-0 opacity-0'
								}`}>
								{sortedChildren.map((child) => (
									<Link
										key={child.slug}
										href={`/?category=${child.slug}`}
										className={`text-sm py-1 transition-colors ${selectedSlug === child.slug
												? 'text-blue-600 font-bold'
												: 'text-slate-500 hover:text-blue-500'
											}`}
									>
										{child.name} <span className="text-[12px] ml-1">({child.count})</span>
									</Link>
								))}
							</div>
						)}
					</div>
				);
			})}
		</aside>
	);
}