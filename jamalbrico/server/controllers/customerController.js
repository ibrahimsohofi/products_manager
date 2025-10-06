import Customer from '../models/Customer.js';

// Get all customers with optional filters
export const getAllCustomers = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      customer_type: req.query.customer_type,
      city: req.query.city,
      limit: req.query.limit,
      offset: req.query.offset
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const customers = await Customer.getAll(filters);
    res.json(customers);
  } catch (error) {
    console.error('Error getting customers:', error);
    // Return empty array when database is not available
    res.json([]);
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.getById(id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const {
      name, email, phone, address, city, postal_code,
      customer_type, credit_limit, notes
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name'
      });
    }

    // Check for duplicate email if provided
    if (email) {
      const existingCustomer = await Customer.getByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({
          error: 'Customer with this email already exists'
        });
      }
    }

    const customerData = {
      name: name.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      postal_code: postal_code?.trim(),
      customer_type: customer_type || 'retail',
      credit_limit: credit_limit ? parseFloat(credit_limit) : 0,
      notes: notes?.trim()
    };

    const newCustomer = await Customer.create(customerData);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, address, city, postal_code,
      customer_type, credit_limit, notes, is_active
    } = req.body;

    // Check if customer exists
    const existingCustomer = await Customer.getById(id);
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validation
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name'
      });
    }

    // Check for duplicate email if changed
    if (email && email !== existingCustomer.email) {
      const duplicateCustomer = await Customer.getByEmail(email);
      if (duplicateCustomer) {
        return res.status(400).json({
          error: 'Customer with this email already exists'
        });
      }
    }

    const customerData = {
      name: name.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      postal_code: postal_code?.trim(),
      customer_type: customer_type || 'retail',
      credit_limit: credit_limit !== undefined ? parseFloat(credit_limit) : existingCustomer.credit_limit,
      notes: notes?.trim(),
      is_active: is_active !== undefined ? is_active : existingCustomer.is_active
    };

    const updatedCustomer = await Customer.update(id, customerData);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Customer.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

// Get customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await Customer.getCustomerStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Error getting customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer statistics' });
  }
};

// Get customer purchase history
export const getCustomerPurchaseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const history = await Customer.getPurchaseHistory(id, parseInt(limit));
    res.json(history);
  } catch (error) {
    console.error('Error getting customer purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch customer purchase history' });
  }
};

// Search customers
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search term must be at least 2 characters long'
      });
    }

    const customers = await Customer.search(q.trim());
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
};

// Get customer types
export const getCustomerTypes = async (req, res) => {
  try {
    const types = await Customer.getCustomerTypes();
    res.json(types);
  } catch (error) {
    console.error('Error getting customer types:', error);
    res.status(500).json({ error: 'Failed to fetch customer types' });
  }
};

// Get top customers
export const getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const customers = await Customer.getTopCustomers(parseInt(limit));
    res.json(customers);
  } catch (error) {
    console.error('Error getting top customers:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
};

// Get inactive customers
export const getInactiveCustomers = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const customers = await Customer.getInactiveCustomers(parseInt(days));
    res.json(customers);
  } catch (error) {
    console.error('Error getting inactive customers:', error);
    res.status(500).json({ error: 'Failed to fetch inactive customers' });
  }
};
