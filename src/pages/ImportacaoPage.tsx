import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFinance } from '../contexts/FinanceContext';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVData {
  descricao: string;
  valor: string;
  data: string;
  categoria: string;
  tipo?: string;
}

const ImportacaoPage: React.FC = () => {
  const { importarCSV } = useFinance();
  const [csvData, setCSVData] = useState<CSVData[]>([]);
  const [tipo, setTipo] = useState<'despesas' | 'receitas'>('despesas');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const headers = results.data[0] as string[];
          const requiredFields = ['descricao', 'valor', 'data', 'categoria'];
          
          const hasAllFields = requiredFields.every(field => 
            headers.map(h => h.toLowerCase()).includes(field.toLowerCase())
          );
          
          if (!hasAllFields) {
            setError('O arquivo CSV deve conter as colunas: descrição, valor, data e categoria');
            return;
          }
          
          const parsedData = results.data.slice(1).map((row: any) => ({
            descricao: row[headers.indexOf('descricao')],
            valor: row[headers.indexOf('valor')],
            data: row[headers.indexOf('data')],
            categoria: row[headers.indexOf('categoria')],
            tipo: row[headers.indexOf('tipo')] || 'conta'
          }));
          
          setCSVData(parsedData);
          setError('');
        },
        header: true,
        skipEmptyLines: true
      });
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });
  
  const handleImport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await importarCSV(tipo, csvData);
      
      setSuccess(`Importação concluída! ${response.registros_importados.length} registros importados.`);
      setCSVData([]);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao importar dados');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Importação de Dados</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Importação
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => setTipo('despesas')}
            className={`px-4 py-2 rounded-md ${
              tipo === 'despesas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setTipo('receitas')}
            className={`px-4 py-2 rounded-md ${
              tipo === 'receitas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Receitas
          </button>
        </div>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Arraste e solte seu arquivo CSV aqui, ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Apenas arquivos CSV são aceitos
        </p>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
          <FileCheck size={20} />
          {success}
        </div>
      )}
      
      {csvData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Pré-visualização dos Dados</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  {tipo === 'despesas' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(row.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.categoria}
                    </td>
                    {tipo === 'despesas' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.tipo}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {csvData.length > 5 && (
            <p className="text-sm text-gray-500 mt-2">
              Mostrando 5 de {csvData.length} registros
            </p>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleImport}
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Importando...' : 'Importar Dados'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportacaoPage;