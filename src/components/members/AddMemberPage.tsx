import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FLOOR_OPTIONS } from '../../types';

export const AddMemberPage: React.FC = () => {
  const { addMember, navigateTo } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    propertyType: 'Residential',
    address: '',
    monthlyAmount: 0,
  });

  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [floorDropdownOpen, setFloorDropdownOpen] = useState(false);
  const floorRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floorRef.current && !floorRef.current.contains(event.target as Node)) {
        setFloorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit strictly to 11 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData((prev) => ({ ...prev, contactNumber: digits }));
    if (errors.contactNumber) {
      setErrors((prev) => ({ ...prev, contactNumber: '' }));
    }
  };

  const toggleFloor = (floor: string) => {
    setSelectedFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Name is required';
    }

    if (!formData.contactNumber.trim()) {
      errs.contactNumber = 'Contact number is required';
    } else if (formData.contactNumber.length !== 11) {
      errs.contactNumber = 'Contact number must be exactly 11 digits (e.g. 03001234567)';
    }

    if (!formData.address.trim()) {
      errs.address = 'Address is required';
    }

    if (formData.monthlyAmount === undefined || formData.monthlyAmount === null || isNaN(Number(formData.monthlyAmount)) || Number(formData.monthlyAmount) < 0) {
      errs.monthlyAmount = 'Assigned amount is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const addr = formData.address.trim();
      const houseNo = addr.split(',')[0].trim() || addr;
      const finalFloors = selectedFloors.length > 0 ? selectedFloors : ['Ground'];

      await addMember({
        fullName: formData.fullName.trim(),
        houseNumber: houseNo,
        address: addr,
        contactNumber: formData.contactNumber.trim(),
        propertyType: formData.propertyType,
        floor: finalFloors.join(', '),
        floors: finalFloors,
        monthlyAmount: Number(formData.monthlyAmount) || 0,
      });

      navigateTo('members');
    } catch (err: any) {
      const msg = err.message || 'Failed to create member.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) navigateTo('members');
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden w-full max-w-xl mx-auto my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Add Member
          </h2>
          <button
            type="button"
            onClick={() => navigateTo('members')}
            className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-in fade-in-50">
              {serverError}
            </div>
          )}

          {/* Row 1: Name & Contact No. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {formData.propertyType === 'Commercial' ? 'Business / Owner Name' : 'Name'}{' '}
                <span className="text-slate-400">*</span>
              </label>
              <input
                type="text"
                placeholder={formData.propertyType === 'Commercial' ? 'Business Name / Owner Name' : 'Member name'}
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all ${
                  errors.fullName ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact No. <span className="text-slate-400">*</span>
              </label>
              <input
                type="text"
                placeholder="03xx xxxxxxx"
                value={formData.contactNumber}
                onChange={handleContactChange}
                maxLength={11}
                className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all ${
                  errors.contactNumber ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
              {errors.contactNumber && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.contactNumber}</p>
              )}
            </div>
          </div>

          {/* Row 2: Property Type & Floor(s) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Property Type <span className="text-slate-400">*</span>
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            {/* Multi-Select Floor(s) */}
            <div className="relative" ref={floorRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Floor(s) <span className="text-slate-400">*</span>
              </label>
              <div
                onClick={() => setFloorDropdownOpen(!floorDropdownOpen)}
                className={`w-full min-h-[38px] px-3.5 py-1.5 text-xs bg-white border rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all outline-none ${
                  floorDropdownOpen ? 'border-slate-400' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedFloors.length === 0 ? (
                    <span className="text-slate-400 py-1">Select floor(s)</span>
                  ) : (
                    selectedFloors.map((fl) => (
                      <span
                        key={fl}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-[#7C3AED] border border-purple-100"
                      >
                        {fl}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFloor(fl);
                          }}
                          className="hover:text-purple-900 rounded-full cursor-pointer ml-0.5"
                          title={`Remove ${fl}`}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${floorDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Floor Dropdown Popover */}
              {floorDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {FLOOR_OPTIONS.map((floor) => {
                      const isSelected = selectedFloors.includes(floor);
                      return (
                        <div
                          key={floor}
                          onClick={() => toggleFloor(floor)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                            isSelected
                              ? 'bg-purple-50/80 text-purple-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{floor}</span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] px-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFloors([...FLOOR_OPTIONS])}
                      className="text-[#7C3AED] hover:underline font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloors([])}
                      className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {formData.propertyType === 'Commercial' ? 'Business Address' : 'Address'}{' '}
              <span className="text-slate-400">*</span>
            </label>
            <input
              type="text"
              placeholder={
                formData.propertyType === 'Commercial'
                  ? 'Shop / Office / Floor / Commercial Plaza / Street / Block'
                  : 'House / Flat / Unit / Street / Block'
              }
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
              }}
              className={`w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 bg-white border rounded-xl placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all ${
                errors.address ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
              }`}
            />
            {errors.address && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.address}</p>
            )}
          </div>

          {/* Row 4: Assigned Amount (PKR) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Amount (PKR) <span className="text-slate-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.monthlyAmount === 0 ? '' : formData.monthlyAmount}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setFormData({ ...formData, monthlyAmount: val });
                if (errors.monthlyAmount) setErrors((prev) => ({ ...prev, monthlyAmount: '' }));
              }}
              className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all font-medium ${
                errors.monthlyAmount ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
              }`}
            />
            {errors.monthlyAmount && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.monthlyAmount}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigateTo('members')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-md shadow-purple-500/25 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
