import { useState, useEffect } from 'react';
import { Client, Book, Industry, EntityType } from '../types';
import * as dataService from '../services/dataService';

/**
 * Custom hook for managing entities (clients, books, industries)
 */
export const useEntityManager = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setClients(dataService.getClients());
    setBooks(dataService.getBooks());
    setIndustries(dataService.getIndustries());
  };

  const addEntity = (type: EntityType, name: string) => {
      switch (type) {
        case 'client': {
          const newClient = dataService.addClient({ name });
          setClients(prev => [...prev, newClient]);
          setSelectedClient(newClient);
          return newClient;
        }
        case 'book': {
          if (!selectedClient) {
            throw new Error("Please select a client before adding a book.");
          }
          const newBook = dataService.addBook({ name, clientId: selectedClient.id });
          setBooks(prev => [...prev, newBook]);
          setSelectedBook(newBook);
          return newBook;
        }
        case 'industry': {
          const newIndustry = dataService.addIndustry({ name });
          setIndustries(prev => [...prev, newIndustry]);
          setSelectedIndustry(newIndustry);
          return newIndustry;
        }
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }
  };

  const getEntityNames = (type: EntityType): string[] => {
    switch (type) {
      case 'client':
        return clients.map(c => c.name);
      case 'book':
        return books.filter(b => b.clientId === selectedClient?.id).map(b => b.name);
      case 'industry':
        return industries.map(i => i.name);
      default:
        return [];
    }
  };

  return {
    clients,
    books,
    industries,
    selectedClient,
    selectedBook,
    selectedIndustry,
    setSelectedClient,
    setSelectedBook,
    setSelectedIndustry,
    addEntity,
    getEntityNames,
    loadInitialData
  };
};