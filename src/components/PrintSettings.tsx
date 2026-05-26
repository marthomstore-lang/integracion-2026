'use client';
import { useState, useEffect } from 'react';

export default function PrintSettings() {
  const [settings, setSettings] = useState<{
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
    font_size_print: string;
    line_height_print: number;
    force_page_breaks: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchPrintSettings = async () => {
      try {
        const response = await fetch('/api/reports?run=SYSTEM&type=print_settings');
        const result = await response.json();
        if (result.success && result.data && result.data.mapping) {
          const mapping = result.data.mapping;
          setSettings({
            margin_top: Number(mapping.margin_top) ?? 15,
            margin_bottom: Number(mapping.margin_bottom) ?? 15,
            margin_left: Number(mapping.margin_left) ?? 15,
            margin_right: Number(mapping.margin_right) ?? 15,
            font_size_print: mapping.font_size_print || '10pt',
            line_height_print: Number(mapping.line_height_print) ?? 1.4,
            force_page_breaks: mapping.force_page_breaks !== false,
          });
        } else {
          // Fallback a valores por defecto si no está configurado en la base de datos
          setSettings({
            margin_top: 15,
            margin_bottom: 15,
            margin_left: 15,
            margin_right: 15,
            font_size_print: '10pt',
            line_height_print: 1.4,
            force_page_breaks: true,
          });
        }
      } catch (error) {
        console.error('Error fetching print settings:', error);
        // Fallback en caso de error
        setSettings({
          margin_top: 15,
          margin_bottom: 15,
          margin_left: 15,
          margin_right: 15,
          font_size_print: '10pt',
          line_height_print: 1.4,
          force_page_breaks: true,
        });
      }
    };
    fetchPrintSettings();
  }, []);

  if (!settings) return null;

  const styleContent = `
    @media print {
      @page {
        margin: ${settings.margin_top}mm ${settings.margin_right}mm ${settings.margin_bottom}mm ${settings.margin_left}mm !important;
        size: letter !important;
      }
      
      body, .print-container, .card, p, td, th, li, span, select, input, textarea, div {
        font-size: ${settings.font_size_print} !important;
        line-height: ${settings.line_height_print} !important;
      }

      ${!settings.force_page_breaks ? `
        .print-section-break, .page-break-always {
          page-break-after: auto !important;
          break-after: auto !important;
          margin-top: 1rem !important;
          border-top: 1px dashed #ccc !important;
          padding-top: 1rem !important;
        }
      ` : ''}
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: styleContent }} />;
}
