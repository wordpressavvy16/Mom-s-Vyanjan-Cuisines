

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, Meal, DietaryPreference, User } from '../types';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSiteSettings } from '../context/SiteSettingsContext';
import * as apiService from '../services/apiService';
import { DIETARY_OPTIONS as ALL_DIETARY_OPTIONS } from '../constants';


const initialPartnerMealFormState: Omit<Meal, 'id' | 'partnerId'> = {
  name: '', description: '', price: 0, imageUrl: '', category: 'Main Course',
  ingredients: [], dietaryTags: [], calories: 0,
  customizationOptions: { spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }
};

const PartnerDashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading, updateUserProfile } = useAuth(); 
  const { currencySymbol } = useSiteSettings();
  const navigate = useNavigate();

  const [myMeals, setMyMeals] = useState<Meal[]>([]);
  const [mealLoading, setMealLoading] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [currentEditingMeal, setCurrentEditingMeal] = useState<Meal | Omit<Meal, 'id' | 'partnerId'>>({...initialPartnerMealFormState});
  const [isNewMeal, setIsNewMeal] = useState(true);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [mealImageInputType, setMealImageInputType] = useState<'url' | 'file'>('url');
  const [activeTab, setActiveTab] = useState('menu'); 

  const loadMyMeals = async () => {
    if (!currentUser) return;
    setMealLoading(true);
    try {
        const meals = await apiService.fetchDashboardMeals(currentUser);
        setMyMeals(meals);
    } catch(e) {
        console.error("Failed to load partner meals", e);
        setMyMeals([]);
    } finally {
        setMealLoading(false);
    }
  };
  
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || currentUser.role !== UserRole.PARTNER) {
        navigate('/'); 
      } else if (currentUser.role === UserRole.PARTNER && !currentUser.isApprovedByAdmin) {
        alert("Your partner account is still awaiting final approval or has been suspended. Please contact support.");
        navigate('/');
      }
       else {
        loadMyMeals();
      }
    }
  }, [currentUser, authLoading, navigate]);

  
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>, onFileReady: (dataUrl: string) => void, maxSizeMB: number = 5) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File is too large. Please select a file under ${maxSizeMB}MB.`);
            if(e.target) e.target.value = '';
            return;
        }
        try {
            const uploadedUrl = await apiService.uploadImageFile(file, currentUser?.id);
            onFileReady(uploadedUrl);
        } catch (err) {
            console.error('Partner file upload failed:', err);
            alert('Could not process selected file.');
        }
    }
  };


  const openMealModal = (meal?: Meal) => {
    if (meal) {
      setCurrentEditingMeal(meal);
      setIngredientsInput(meal.ingredients.join(', '));
      setIsNewMeal(false);
      setMealImageInputType(meal.imageUrl?.startsWith('data:') ? 'file' : 'url');
    } else {
      setCurrentEditingMeal({...initialPartnerMealFormState});
      setIngredientsInput('');
      setIsNewMeal(true);
      setMealImageInputType('url');
    }
    setIsMealModalOpen(true);
  };

  const closeMealModal = () => setIsMealModalOpen(false);

  const handleMealFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentEditingMeal(prev => ({ ...prev, [name]: name === 'price' || name === 'calories' ? Number(value) : value }));
  };
  
  const handleDietaryTagChange = (tag: DietaryPreference) => {
    setCurrentEditingMeal(prev => {
        const currentTags = (prev as Meal).dietaryTags || []; 
        const newTags = currentTags.includes(tag) 
            ? currentTags.filter(t => t !== tag) 
            : [...currentTags, tag];
        return { ...prev, dietaryTags: newTags };
    });
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!(currentEditingMeal as Meal).name || !(currentEditingMeal as Meal).price || !(currentEditingMeal as Meal).imageUrl) {
        alert("Name, Price, and Image are required fields.");
        return;
    }
    setMealLoading(true);
    const mealDataToSave = {
        ...currentEditingMeal,
        ingredients: ingredientsInput.split(',').map(i => i.trim()).filter(i => i),
    };

    try {
        if (isNewMeal) { 
            await apiService.addDashboardMeal(mealDataToSave as Omit<Meal, 'id'>, currentUser); 
        } else { 
            await apiService.updateDashboardMeal(mealDataToSave as Meal, currentUser); 
        }
        await loadMyMeals(); 
    } catch (error) {
        console.error("Failed to save meal:", error);
        alert("An error occurred while saving the meal.");
    } finally {
        setMealLoading(false);
        closeMealModal();
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to delete this meal? This action cannot be undone.")) {
      setMealLoading(true);
      try {
        await apiService.deleteDashboardMeal(mealId, currentUser);
        await loadMyMeals(); 
      } catch (error) {
        console.error("Failed to delete meal:", error);
        alert("An error occurred while deleting the meal.");
      } finally {
        setMealLoading(false);
      }
    }
  };

  const handleAcknowledgeAgreement = async () => {
    if (currentUser) {
        await apiService.acknowledgePartnerAgreement(currentUser.id);
        const updatedUser: User = { ...currentUser, agreementAcknowledged: true };
        await updateUserProfile(updatedUser); 
        alert("Partnership Agreement Acknowledged. Thank you!");
    }
  };


  if (authLoading || !currentUser) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner text="Loading Partner Dashboard..." size="lg" /></div>;
  }
  
  const TabButton: React.FC<{ tabName: string; label: string; controls: string; }> = ({ tabName, label, controls }) => (
    <button role="tab" id={`tab-${tabName}`} aria-controls={controls} aria-selected={activeTab === tabName} onClick={() => setActiveTab(tabName)} className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded-t-lg font-medium transition-colors focus:outline-none whitespace-nowrap ${activeTab === tabName ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-primary-light hover:text-white dark:hover:bg-secondary'}`}>{label}</button>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 space-y-10">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Welcome, {currentUser.firstName}!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">This is your Partner Dashboard.</p>
      </header>

      {!currentUser.agreementAcknowledged && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md shadow">
          <h3 className="font-bold">Action Required</h3>
          <p>Please review and acknowledge the Partnership Agreement to ensure full access and compliance. You can find it under the "Agreement" tab.</p>
        </div>
      )}

      <nav>
        <div role="tablist" aria-label="Partner Dashboard Sections" className="flex flex-wrap border-b border-gray-300 dark:border-gray-700 -mb-px">
            <TabButton tabName="menu" label="My Menu" controls="tabpanel-menu" />
            <TabButton tabName="orders" label="My Orders (Coming Soon)" controls="tabpanel-orders" />
            <TabButton tabName="agreement" label="Partnership Agreement" controls="tabpanel-agreement" />
        </div>
      </nav>

      <main className="mt-6">
        <div role="tabpanel" id="tabpanel-menu" aria-labelledby="tab-menu" hidden={activeTab !== 'menu'}>
            <section className="bg-white dark:bg-secondary p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">My Tiffin Menu</h2>
                    <button onClick={() => openMealModal()} className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base">Add New Meal</button>
                </div>
                {mealLoading ? <LoadingSpinner text="Loading your meals..." /> : (myMeals.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-center py-4">You haven't added any meals yet. Click "Add New Meal" to get started!</p> : <div className="space-y-3 sm:space-y-4">{myMeals.map(meal => (<div key={meal.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:shadow-sm dark:hover:bg-secondary-dark/50 transition-shadow"><div className="flex items-center space-x-3 sm:space-x-4 flex-grow min-w-0"><img src={meal.imageUrl} alt={meal.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"/><div className="min-w-0 flex-grow"><p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={meal.name}>{meal.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{currencySymbol}{meal.price.toFixed(2)} - {meal.category}</p><p className="text-xs text-gray-500 dark:text-gray-500 truncate hidden sm:block" title={meal.description}>{meal.description}</p></div></div><div className="flex space-x-2 mt-2 sm:mt-0 self-end sm:self-center flex-shrink-0"><button onClick={() => openMealModal(meal)} className="text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2.5 rounded-md transition-colors">Edit</button><button onClick={() => handleDeleteMeal(meal.id)} className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2.5 rounded-md transition-colors">Delete</button></div></div>))}</div>)}
            </section>
        </div>
        <div role="tabpanel" id="tabpanel-orders" aria-labelledby="tab-orders" hidden={activeTab !== 'orders'}>
            <div className="text-center py-10 bg-white dark:bg-secondary rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Order Management</h2>
                <p className="text-gray-500 dark:text-gray-400">This feature is coming soon! You'll be able to see and manage orders delegated to you here.</p>
            </div>
        </div>
        <div role="tabpanel" id="tabpanel-agreement" aria-labelledby="tab-agreement" hidden={activeTab !== 'agreement'}>
             <section className="bg-white dark:bg-secondary p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Partnership Agreement</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none border dark:border-gray-700 p-4 rounded-md bg-gray-50 dark:bg-secondary-dark max-h-96 overflow-y-auto">
                    <h3>1. Introduction</h3>
                    <p>This document constitutes a legally binding agreement between you ("Partner") and MoM's Vyanjan ("Company") governing your participation in the MoM's Vyanjan Partner Program.</p>
                    <h3>2. Responsibilities of the Partner</h3>
                    <ul>
                        <li>Ensure all food is prepared in a clean, hygienic environment, adhering to local food safety standards.</li>
                        <li>Provide accurate meal descriptions, ingredients, and allergen information.</li>
                        <li>Prepare and package orders in a timely manner for pickup by the Company's delivery fleet.</li>
                    </ul>
                    <h3>3. Responsibilities of the Company</h3>
                     <ul>
                        <li>Provide a platform for the Partner to list their meals.</li>
                        <li>Manage customer orders, payments, and delivery logistics.</li>
                        <li>Provide customer support related to the platform and delivery.</li>
                    </ul>
                    <h3>4. Commission and Payment</h3>
                    <p>The Company will retain a commission of [XX]% from the price of each meal sold through the platform. Payouts will be made on a [bi-weekly] basis.</p>
                    <p><em>This is a mock agreement for demonstration purposes.</em></p>
                </div>
                {!currentUser.agreementAcknowledged ? (
                    <div className="mt-6 text-center">
                        <button onClick={handleAcknowledgeAgreement} className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg">
                            I Have Read and Acknowledge This Agreement
                        </button>
                    </div>
                ) : (
                    <p className="mt-6 text-center font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50 p-3 rounded-md">You acknowledged this agreement on {new Date().toLocaleDateString()}.</p>
                )}
             </section>
        </div>
      </main>

      {/* Meal Modal */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-secondary p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{isNewMeal ? 'Add New Meal' : 'Edit Meal'}</h3>
            <form onSubmit={handleMealSubmit} className="space-y-3 text-sm">
                <div><label className="block text-xs font-medium">Name*</label><input type="text" name="name" value={(currentEditingMeal as Meal).name || ''} onChange={handleMealFormChange} required className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/></div>
                <div><label className="block text-xs font-medium">Description</label><textarea name="description" value={(currentEditingMeal as Meal).description || ''} onChange={handleMealFormChange} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white" rows={2}></textarea></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium">Price*</label><input type="number" name="price" value={(currentEditingMeal as Meal).price === 0 ? '' : (currentEditingMeal as Meal).price} onChange={handleMealFormChange} required min="0.01" step="0.01" className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/></div>
                    <div><label className="block text-xs font-medium">Calories</label><input type="number" name="calories" value={(currentEditingMeal as Meal).calories === 0 ? '' : (currentEditingMeal as Meal).calories} onChange={handleMealFormChange} min="0" className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/></div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Image*</label>
                    <div className="flex gap-2 text-xs mb-1">
                        <label className="flex items-center gap-1"><input type="radio" value="url" checked={mealImageInputType === 'url'} onChange={()=>setMealImageInputType('url')}/> URL</label>
                        <label className="flex items-center gap-1"><input type="radio" value="file" checked={mealImageInputType === 'file'} onChange={()=>setMealImageInputType('file')}/> Upload File</label>
                    </div>
                    {mealImageInputType === 'url' ? (
                        <input type="url" name="imageUrl" value={(currentEditingMeal as Meal).imageUrl || ''} onChange={handleMealFormChange} placeholder="https://example.com/image.jpg" className="w-full p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/>
                    ) : (
                        <input type="file" name="imageFile" accept="image/*" onChange={(e) => handleFileSelection(e, (dataUrl) => setCurrentEditingMeal(prev => ({...prev, imageUrl: dataUrl})))} className="w-full text-xs p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/>
                    )}
                    {(currentEditingMeal as Meal).imageUrl && <img src={(currentEditingMeal as Meal).imageUrl} alt="preview" className="mt-2 h-20 w-20 object-cover rounded shadow"/>}
                </div>
                <div><label className="block text-xs font-medium">Category*</label><input type="text" name="category" value={(currentEditingMeal as Meal).category || 'Main Course'} onChange={handleMealFormChange} required className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/></div>
                <div><label className="block text-xs font-medium">Ingredients (comma-separated)</label><input type="text" value={ingredientsInput} onChange={(e) => setIngredientsInput(e.target.value)} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-secondary-dark dark:text-white"/></div>
                <div>
                    <label className="block text-xs font-medium mb-1">Dietary Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                    {ALL_DIETARY_OPTIONS.map(tag => (
                        <button key={tag} type="button" onClick={() => handleDietaryTagChange(tag)} className={`px-2 py-1 text-xs rounded-full border transition-colors ${(currentEditingMeal as Meal).dietaryTags?.includes(tag) ? 'bg-primary text-white border-primary-dark' : 'bg-gray-100 hover:bg-gray-200 dark:bg-secondary-dark dark:hover:bg-gray-700'}`}>
                        {tag}
                        </button>
                    ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={closeMealModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 font-semibold py-1.5 px-3 rounded text-xs">Cancel</button>
                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-3 rounded text-xs">{isNewMeal ? 'Add Meal' : 'Save Changes'}</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboardPage;
