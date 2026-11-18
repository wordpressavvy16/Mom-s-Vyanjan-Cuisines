

import React from 'react';
import { Testimonial } from '../types';
import StarRatingDisplay from './StarRatingDisplay';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-secondary/20 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
      {testimonial.imageUrl && (
        <img 
          src={testimonial.imageUrl} 
          alt={testimonial.name} 
          className="w-20 h-20 rounded-full object-cover mx-auto mb-5 shadow-md border-2 border-white"
          loading="lazy"
        />
      )}
      <div className="text-center flex-grow flex flex-col justify-between">
        <blockquote className="mb-4">
            <p className="text-light-text dark:text-dark-text italic text-base leading-relaxed">"{testimonial.comment}"</p>
        </blockquote>
        <div>
            <div className="flex justify-center mb-2">
                <StarRatingDisplay rating={testimonial.rating} size="md" />
            </div>
            <cite className="text-secondary-dark font-semibold font-display text-lg not-italic dark:text-accent">- {testimonial.name}</cite>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;