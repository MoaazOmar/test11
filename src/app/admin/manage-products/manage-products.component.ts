import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { Product } from '../../../interfaces/product.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-manage-products',
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.css']
})
export class ManageProductsComponent implements OnInit {
  products: Product[] = [];
  editForm: FormGroup;
  showModal: boolean = false;
  selectedProduct: Product | null = null;
  newImages: File[] = [];
  searchQuery: string = '';
  imagesToDelete: string[] = [];
  selectedFiles: File[] = []; // Store actual files
  // For Searching 
  searchTerm: string = '';
  filteredProducts: Product[] = [];   // List after search filtering
  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 6;

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  colors = [
    { name: 'black', class: 'black' },
    { name: 'white', class: 'white' },
    { name: 'red', class: 'red' },
    { name: 'blue', class: 'blue' },
    { name: 'green', class: 'green' },
    { name: 'yellow', class: 'yellow' },
    { name: 'purple', class: 'purple' },
    { name: 'orange', class: 'orange' },
    { name: 'pink', class: 'pink' },
    { name: 'teal', class: 'teal' },
    { name: 'gray', class: 'gray' },
    { name: 'brown', class: 'brown' },
    { name: 'navy', class: 'navy' },
    { name: 'lime', class: 'lime' },
    { name: 'magenta', class: 'magenta' },
    { name: 'cyan', class: 'cyan' },
    { name: 'olive', class: 'olive' },
    { name: 'maroon', class: 'maroon' }
  ];
  genders = ['Male', 'Female', 'Special', 'all'];

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      price: ['', Validators.required],
      stock: [0, Validators.min(0)], // Changed from quantity to stock
      description: [''],
      season: [''],
      sizes: [[]],
      colors: [[]],
      gender: [[]]
    });
  }

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    this.adminService.getAllProducts().subscribe((products) => {
      this.products = products.map(product => ({
        ...product,
        image: product.image.map(img => `http://localhost:3000/images/${img}`)
      }));
      // Initialize filteredProducts to include all products initially.
      this.filteredProducts = [...this.products];
    });
  }
  
  openEditModal(product: Product) {
    this.selectedProduct = product;
    this.editForm.patchValue({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock, // Changed from quantity to stock
      description: product.description || '',
      season: product.season || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      gender: product.gender || []
    });
    this.newImages = [];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
    this.newImages = [];
    this.editForm.reset();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.newImages = Array.from(input.files);
    }
  }

  toggleSize(size: string) {
    const sizes = this.editForm.get('sizes')?.value || [];
    const index = sizes.indexOf(size);
    if (index === -1) {
      sizes.push(size);
    } else {
      sizes.splice(index, 1);
    }
    this.editForm.patchValue({ sizes });
  }

  toggleColor(color: string) {
    const colors = this.editForm.get('colors')?.value || [];
    const index = colors.indexOf(color);
    if (index === -1) {
      colors.push(color);
    } else {
      colors.splice(index, 1);
    }
    this.editForm.patchValue({ colors });
  }

  toggleGender(gender: string) {
    const genders = this.editForm.get('gender')?.value || [];
    const index = genders.indexOf(gender);
    if (index === -1) {
      genders.push(gender);
    } else {
      genders.splice(index, 1);
    }
    this.editForm.patchValue({ gender: genders });
  }

  updateProduct() {
    if (this.editForm.invalid || !this.selectedProduct) return;

    const formData = new FormData();
    formData.append('productId', this.selectedProduct._id);
    Object.keys(this.editForm.value).forEach(key => {
      if (key === 'sizes' || key === 'colors' || key === 'gender') {
        formData.append(key, JSON.stringify(this.editForm.value[key]));
      } else {
        formData.append(key, this.editForm.value[key]);
      }
    });
    this.newImages.forEach(file => formData.append('image', file));
    if (this.imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(this.imagesToDelete));
    }

    this.adminService.updateProduct(this.selectedProduct._id, formData).subscribe(
      (response) => {
        console.log('Product updated:', response);
        this.fetchProducts();
        this.closeModal();
      },
      (error) => {
        console.error('Error updating product:', error);
      }
    );
  }

  removeImage(imagePath: string) {
    this.selectedProduct!.image = this.selectedProduct!.image.filter(img => img !== imagePath);
    const filename = imagePath.split('/').pop() ?? '';
    this.imagesToDelete.push(filename);
  }

  getStatus(stock: number): string { // Changed from quantity to stock
    if (stock === 0) return 'out-of-stock';
    if (stock < 30) return 'low-stock'; // Adjust threshold if needed
    return 'active';
  }
  // SearchTerm Method
  onSearch(query: string) {
    this.searchTerm = query;
    this.currentPage = 1; // Reset page when new search is performed

    if (query) {
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      this.filteredProducts = [...this.products];
    }
  }
    // Returns the products to display on the current page.
    get paginatedProducts(): Product[] {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
    }
  
    // Total number of pages
    get totalPages(): number {
      return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    }
  
    // Pagination controls
    setPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    }
  
}