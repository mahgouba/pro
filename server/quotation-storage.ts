// Simple and clean quotation and invoice storage implementation
import type { Quotation, InsertQuotation } from "@shared/schema";

export class QuotationStorage {
  private quotations: Map<number, any> = new Map();
  private invoices: Map<number, any> = new Map();
  private currentQuotationId: number = 1;
  private currentInvoiceId: number = 1;

  // Clean quotation methods
  async getAllQuotations(): Promise<any[]> {
    return Array.from(this.quotations.values());
  }

  async getQuotation(id: number): Promise<any | undefined> {
    return this.quotations.get(id);
  }

  async createQuotation(quotationData: any): Promise<any> {
    try {
      console.log('Creating quotation with data:', quotationData);
      
      const id = this.currentQuotationId++;
      const quotation = {
        id,
        quoteNumber: quotationData.quoteNumber || `Q-${Date.now()}`,
        inventoryItemId: quotationData.inventoryItemId || null,
        manufacturer: quotationData.manufacturer || '',
        category: quotationData.category || '',
        trimLevel: quotationData.trimLevel || '',
        year: quotationData.year || new Date().getFullYear(),
        exteriorColor: quotationData.exteriorColor || '',
        interiorColor: quotationData.interiorColor || '',
        chassisNumber: quotationData.chassisNumber || '',
        engineCapacity: quotationData.engineCapacity || '',
        specifications: quotationData.specifications || '',
        basePrice: quotationData.basePrice || '0',
        finalPrice: quotationData.finalPrice || '0',
        customerName: quotationData.customerName || '',
        customerPhone: quotationData.customerPhone || '',
        customerEmail: quotationData.customerEmail || '',
        customerTitle: quotationData.customerTitle || '',
        notes: quotationData.notes || '',
        validUntil: quotationData.validUntil || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: quotationData.status || 'مسودة',
        createdBy: quotationData.createdBy || 'system',
        companyData: quotationData.companyData || '',
        representativeData: quotationData.representativeData || '',
        pricingDetails: quotationData.pricingDetails || '',
        qrCodeData: quotationData.qrCodeData || '',
        isInvoice: quotationData.isInvoice || false,
        invoiceNumber: quotationData.invoiceNumber || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.quotations.set(id, quotation);
      console.log('Quotation created successfully:', quotation);
      
      return quotation;
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw new Error('فشل في حفظ عرض السعر');
    }
  }

  async updateQuotation(id: number, quotationData: Partial<any>): Promise<any | undefined> {
    try {
      const existing = this.quotations.get(id);
      if (!existing) return undefined;

      const updated = {
        ...existing,
        ...quotationData,
        id, // Ensure ID stays the same
        updatedAt: new Date()
      };

      this.quotations.set(id, updated);
      console.log('Quotation updated successfully:', updated);
      
      return updated;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw new Error('فشل في تحديث عرض السعر');
    }
  }

  async deleteQuotation(id: number): Promise<boolean> {
    try {
      const deleted = this.quotations.delete(id);
      console.log(`Quotation ${id} deleted:`, deleted);
      return deleted;
    } catch (error) {
      console.error('Error deleting quotation:', error);
      return false;
    }
  }

  async getQuotationsByStatus(status: string): Promise<any[]> {
    return Array.from(this.quotations.values()).filter(q => q.status === status);
  }

  async getQuotationByNumber(quoteNumber: string): Promise<any | undefined> {
    return Array.from(this.quotations.values()).find(q => 
      q.quoteNumber === quoteNumber || q.invoiceNumber === quoteNumber
    );
  }

  // Invoice methods
  async createInvoice(invoiceData: any): Promise<any> {
    try {
      console.log('Creating invoice with data:', invoiceData);
      
      const id = this.currentInvoiceId++;
      const invoice = {
        id,
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        quoteNumber: invoiceData.quoteNumber || '',
        inventoryItemId: invoiceData.inventoryItemId || null,
        manufacturer: invoiceData.manufacturer || '',
        category: invoiceData.category || '',
        trimLevel: invoiceData.trimLevel || '',
        year: invoiceData.year || new Date().getFullYear(),
        exteriorColor: invoiceData.exteriorColor || '',
        interiorColor: invoiceData.interiorColor || '',
        chassisNumber: invoiceData.chassisNumber || '',
        engineCapacity: invoiceData.engineCapacity || '',
        specifications: invoiceData.specifications || '',
        basePrice: invoiceData.basePrice || '0',
        finalPrice: invoiceData.finalPrice || '0',
        customerName: invoiceData.customerName || '',
        customerPhone: invoiceData.customerPhone || '',
        customerEmail: invoiceData.customerEmail || '',
        customerTitle: invoiceData.customerTitle || '',
        notes: invoiceData.notes || '',
        status: invoiceData.status || 'مسودة',
        createdBy: invoiceData.createdBy || 'system',
        companyData: invoiceData.companyData || '',
        representativeData: invoiceData.representativeData || '',
        pricingDetails: invoiceData.pricingDetails || '',
        qrCodeData: invoiceData.qrCodeData || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.invoices.set(id, invoice);
      console.log('Invoice created successfully:', invoice);
      
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('فشل في حفظ الفاتورة');
    }
  }

  async getInvoices(): Promise<any[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoiceById(id: number): Promise<any | undefined> {
    return this.invoices.get(id);
  }

  async updateInvoice(id: number, invoiceData: any): Promise<any | undefined> {
    try {
      const existing = this.invoices.get(id);
      if (!existing) return undefined;

      const updated = {
        ...existing,
        ...invoiceData,
        id,
        updatedAt: new Date()
      };

      this.invoices.set(id, updated);
      console.log('Invoice updated successfully:', updated);
      
      return updated;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('فشل في تحديث الفاتورة');
    }
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const deleted = this.invoices.delete(id);
      console.log(`Invoice ${id} deleted:`, deleted);
      return deleted;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  async getInvoicesByStatus(status: string): Promise<any[]> {
    return Array.from(this.invoices.values()).filter(i => i.status === status);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<any | undefined> {
    return Array.from(this.invoices.values()).find(i => i.invoiceNumber === invoiceNumber);
  }
}

// Export a singleton instance
export const quotationStorage = new QuotationStorage();