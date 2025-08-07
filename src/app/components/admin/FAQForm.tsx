"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../store/index";
import RichTextEditor from "../RichTextEditor";
import {
  useGetAdminFAQsQuery,
  useCreateFAQMutation,
  useUpdateFAQMutation,
  FAQ,
} from "../../store/services/faqApi";

interface FAQFormProps {
  faq?: FAQ;
  isEdit?: boolean;
}

export default function FAQForm({ faq, isEdit = false }: FAQFormProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<
    Omit<FAQ, "_id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">
  >({
    question: faq?.question || "",
    answer: faq?.answer || "",
    category: faq?.category || "General",
    isActive: faq?.isActive !== undefined ? faq.isActive : true,
    order: faq?.order || 0,
  });

  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>(["General"]);

  // RTK Query hooks
  const { data: faqsData } = useGetAdminFAQsQuery();
  const [createFAQ, { isLoading: isCreating }] = useCreateFAQMutation();
  const [updateFAQ, { isLoading: isUpdating }] = useUpdateFAQMutation();

  const loading = isCreating || isUpdating;

  // Extract categories from FAQ data
  useEffect(() => {
    if (faqsData?.faqs) {
      const uniqueCategories = Array.from(
        new Set(faqsData.faqs.map((f: FAQ) => f.category))
      );
      setCategories(
        uniqueCategories.length > 0 ? uniqueCategories : ["General"]
      );
    }
  }, [faqsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError("Question and answer are required");
      return;
    }

    try {
      if (isEdit && faq?._id) {
        await updateFAQ({
          id: faq._id,
          ...formData,
        }).unwrap();
      } else {
        await createFAQ(formData).unwrap();
      }
      router.push("/dashboard/admin/faqs");
    } catch (error: any) {
      console.error(`Error ${isEdit ? "updating" : "creating"} FAQ:`, error);
      setError(
        error?.data?.error || `Failed to ${isEdit ? "update" : "create"} FAQ`
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleAnswerChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      answer: content,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Question */}
        <div>
          <label
            htmlFor="question"
            className="block text-sm font-medium text-gray-700"
          >
            Question *
          </label>
          <input
            type="text"
            id="question"
            name="question"
            value={formData.question}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter the FAQ question"
          />
        </div>

        {/* Answer */}
        <div>
          <label
            htmlFor="answer"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Answer *
          </label>
          <RichTextEditor
            label="Answer"
            value={formData.answer}
            onChange={handleAnswerChange}
            placeholder="Enter the FAQ answer"
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <div className="mt-1 flex">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or enter new category"
              className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value.trim(),
                  }));
                  e.target.value = "";
                }
              }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Select an existing category or type a new one
          </p>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order */}
          <div>
            <label
              htmlFor="order"
              className="block text-sm font-medium text-gray-700"
            >
              Display Order
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Lower numbers appear first
            </p>
          </div>

          {/* Active Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : isEdit ? "Update FAQ" : "Create FAQ"}
          </button>
        </div>
      </form>
    </div>
  );
}
